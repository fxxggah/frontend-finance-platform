/*
 * QA visual local, sem dependências adicionais e sem chamadas ao backend.
 * Inicie o app e um Chrome isolado com --headless=new --remote-debugging-port=9334.
 * Execute: node scripts/design-smoke.cjs
 * Capturas e relatório são gravados no diretório temporário fin-design-review.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const ts = require('typescript');

const base = process.env.QA_BASE_URL || 'http://localhost:3000';
const cdp = process.env.QA_CDP_URL || 'http://localhost:9334';
const output = path.join(os.tmpdir(), 'fin-design-review');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function loadFixtures() {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('lib/mock-data.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'module', code)(module.exports, module);
  return module.exports;
}

async function run() {
  fs.mkdirSync(output, { recursive: true });
  // Contexto separado evita que outra aba do preview altere cookies durante o QA.
  const browserInfo = await fetch(`${cdp}/json/version`).then(r => r.json());
  const browserSocket = new WebSocket(browserInfo.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { browserSocket.onopen = resolve; browserSocket.onerror = reject; });
  let browserId = 0;
  const browserPending = new Map();
  browserSocket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const task = browserPending.get(message.id);
    if (task) { browserPending.delete(message.id); message.error ? task.reject(message.error) : task.resolve(message.result); }
  };
  const browserSend = (method, params = {}) => new Promise((resolve, reject) => {
    browserPending.set(++browserId, { resolve, reject });
    browserSocket.send(JSON.stringify({ id: browserId, method, params }));
  });
  const { browserContextId } = await browserSend('Target.createBrowserContext', { disposeOnDetach: true });
  const { targetId } = await browserSend('Target.createTarget', { url: 'about:blank', browserContextId });
  const target = (await fetch(`${cdp}/json/list`).then(r => r.json())).find(t => t.id === targetId);
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const task = pending.get(message.id);
      pending.delete(message.id);
      if (task) { clearTimeout(task.timer); message.error ? task.reject(message.error) : task.resolve(message.result); }
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      const text = message.params.args.map(a => a.value || a.description || '').join(' ');
      // Falhas do script externo do Google são tratadas pela própria tela de login.
      if (!text.includes('accounts.google.com')) exceptions.push(text);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    const timer = setTimeout(() => { pending.delete(next); reject(new Error(`Timeout: ${method}`)); }, 20000);
    pending.set(next, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const fixtures = loadFixtures();
  const init = String.raw`(() => {
    const m = ${JSON.stringify(fixtures)};
    const original = window.fetch.bind(window);
    window.__qaRequests = [];
    const page = content => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 100, first: true, last: true, empty: content.length === 0 });
    window.fetch = (input, options = {}) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
      if (url.pathname === '/api/auth/refresh') return Promise.resolve(Response.json({ accessToken: 'isolated-visual-qa' }));
      if (!url.pathname.includes('/api/v1/')) return original(input, options);
      const route = url.pathname.replace('/api/v1', '');
      const method = options.method || input.method || 'GET';
      window.__qaRequests.push({ route, method, body: options.body });
      if (method !== 'GET') return Promise.resolve(Response.json({ status: 400, title: 'Dados inválidos', errors: [{ field: 'name', message: 'Revise o nome informado.' }] }, { status: 400 }));
      const routes = {
        '/users/me': m.currentUser, '/accounts': m.mockAccountsResponse,
        '/categories': m.mockCategories.filter(c => !url.searchParams.get('type') || c.type === url.searchParams.get('type')),
        '/credit-cards': m.mockCreditCards, '/credit-cards/1/invoices': m.mockInvoices,
        '/goals': m.mockGoals.filter(g => !url.searchParams.get('status') || g.status === url.searchParams.get('status')),
        '/dashboard/summary': m.dashboardSummary,
        '/dashboard/expenses-by-category': m.expenseCategories,
        '/dashboard/evolution': m.evolutionResponse,
        '/dashboard/recent-transactions': m.mockTransactions.slice(0,5).map(t => ({ id:t.id, type:t.type, amount:t.amount, date:t.date, categoryName:t.category.name, accountName:t.account?.name, creditCardName:t.creditCard?.name })),
        '/transactions': page(m.mockTransactions.filter(t => !url.searchParams.get('creditCardId') || t.creditCard?.id === Number(url.searchParams.get('creditCardId')))),
        '/transfers': page(m.mockTransfers),
      };
      let data = routes[route];
      if (data === undefined && /^\/goals\/\d+$/.test(route)) data = m.mockGoals.find(g => g.id === Number(route.split('/')[2]));
      if (data === undefined && /^\/goals\/\d+\/contributions$/.test(route)) data = m.mockGoalContributions[route.split('/')[2]] || [];
      if (data === undefined) return Promise.resolve(Response.json({ title: 'Fixture não mapeada', detail: route }, { status: 404 }));
      return Promise.resolve(Response.json(data));
    };
  })();`;
  const results = [];
  const failures = [];
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: init });
    await send('Network.setCookie', { name: 'fin_session', value: 'mock-refresh-token-67890', url: `${base}/`, path: '/', httpOnly: true });
    const navigate = async route => {
      await send('Page.navigate', { url: `${base}${route}` });
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(`location.pathname === ${JSON.stringify(route.split('?')[0])} && document.readyState === 'complete' && !!document.querySelector('main')`)) break;
        await sleep(100);
      }
      await sleep(500);
    };
    const checkPreferences = async () => {
      await navigate('/dashboard');
      const preferences = [];
      for (const width of [1440,390]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        for (const reduced of [false,true]) {
          await send('Emulation.setEmulatedMedia', { features: [
            { name: 'prefers-reduced-transparency', value: reduced ? 'reduce' : 'no-preference' },
            { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
          ] });
          await sleep(150);
          const row = await evaluate(`(() => { const dock=document.querySelector('nav[class*="dock"]');const bottom=document.querySelector('nav[class*="bottom"]');return { width:innerWidth,reduced:matchMedia('(prefers-reduced-transparency: reduce)').matches,dock:getComputedStyle(dock).backdropFilter,bottom:getComputedStyle(bottom).backdropFilter,motion:getComputedStyle(dock.querySelector('button')).transitionDuration } })()`);
          preferences.push(row);
          assert.equal(row.reduced, reduced, 'Preferência emulada');
          assert.equal(row.dock, reduced || width < 640 ? 'none' : 'blur(12px)', 'Blur da barra de ações');
          assert.equal(row.bottom, reduced ? 'none' : 'blur(12px)', 'Blur da BottomNav');
          if (reduced) assert(parseFloat(row.motion) < .001, 'Movimento reduzido');
        }
      }
      await send('Emulation.setEmulatedMedia', { features: [] });
      await navigate('/categories');
      await evaluate(`document.querySelector('[role="tab"]').focus()`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
      await sleep(100);
      assert(await evaluate(`document.activeElement.getAttribute('aria-selected')==='true' && document.activeElement.textContent==='Receitas'`), 'Navegação das abas com teclado');
      fs.writeFileSync(path.join(output, 'preferences.json'), JSON.stringify({ preferences, keyboardTabs: true }, null, 2));
      console.log(JSON.stringify({ preferences, keyboardTabs: true }));
    };
    if (process.env.QA_PREFERENCES_ONLY === 'true') { await checkPreferences(); return; }
    const routes = process.env.QA_FORMS_ONLY === 'true' ? [] : ['/dashboard', '/accounts', '/transactions', '/transactions?tab=transfers', '/transfers', '/cards', '/cards/1', '/cards/1/invoices/2026-10', '/goals', '/goals/1', '/reports', '/categories', '/settings', '/simulations/investment', '/simulations/debt'];
    for (const width of (process.env.QA_WIDTHS || '320,390,768,1024,1440').split(',').map(Number)) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      for (const route of routes) {
        await navigate(route);
        for (const theme of ['light', 'dark']) {
          await evaluate(`document.documentElement.dataset.theme='${theme}';document.documentElement.classList.toggle('dark','${theme}'==='dark');window.dispatchEvent(new Event('fin:theme-change'));localStorage.setItem('fin-theme','${theme}');`);
          await sleep(250);
          const result = await evaluate(`({ overflow: document.documentElement.scrollWidth > innerWidth, heading: document.querySelector('main h1')?.textContent, error: /Erro ao carregar|Não foi possível carregar seus dados|Ops! Algo deu errado/.test(document.querySelector('main')?.innerText || '') })`);
          results.push({ width, route, theme, ...result });
          if (result.overflow || result.error || !result.heading) failures.push({ width, route, theme, ...result });
          if ([390,1440].includes(width) && ['/dashboard','/accounts','/cards','/reports','/settings'].includes(route)) {
            const shot = await send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(output, `${route.slice(1)}-${width}-${theme}.png`), Buffer.from(shot.data, 'base64'));
          }
        }
      }
      console.log(`Layout: ${width}px, ${routes.length} rotas, dois temas.`);
    }
    for (const route of routes.filter(r => !r.includes('?'))) {
      for (const state of ['loading','empty','error']) {
        await navigate(`${route}?state=${state}`);
        const result = await evaluate(`({ text: document.querySelector('main')?.innerText || '', skeleton: !!document.querySelector('main [aria-busy="true"]') })`);
        if (state === 'loading' ? !result.skeleton : !/nenhum|nenhuma|indisponível|não foi possível|erro ao|próximo passo|perfil indisponível/i.test(result.text)) failures.push({ route, state, result });
      }
    }
    // Foco, Escape, validação de campo e mapeamento de ProblemDetail em modal real.
    await navigate('/accounts');
    await evaluate(`document.querySelector('main header button').focus();document.querySelector('main header button').click()`);
    await sleep(300);
    assert(await evaluate(`!!document.querySelector('[role="dialog"]')?.contains(document.activeElement)`), 'Foco inicial do modal');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', modifiers: 8 });
    assert(await evaluate(`!!document.querySelector('[role="dialog"]')?.contains(document.activeElement)`), 'Foco preso no modal');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await sleep(200);
    assert(await evaluate(`!document.querySelector('[role="dialog"]') && document.activeElement === document.querySelector('main header button')`), 'Retorno do foco');
    console.log('Modal: foco inicial, Tab e Escape verificados.');
    await evaluate(`document.querySelector('main header button').click()`);
    await sleep(200);
    await evaluate(`document.querySelector('#account-name').focus()`);
    await send('Input.insertText', { text: 'Conta de revisão visual' });
    await evaluate(`document.querySelector('[role="dialog"] form').requestSubmit()`);
    await sleep(400);
    assert(await evaluate(`document.querySelector('[role="dialog"]').innerText.includes('Revise o nome informado.')`), 'ProblemDetail no campo do formulário');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    const forms = [
      ['/cards', 'Novo cartão'], ['/goals', 'Nova meta'], ['/categories', 'Nova categoria'],
      ['/cards/1/invoices/2026-10', 'Pagar fatura'], ['/goals/1', 'Adicionar depósito/retirada'],
      ['/transfers', 'Nova transferência'],
    ];
    for (const width of [320,1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      for (const [route, label] of forms) {
        await navigate(route);
        const clicked = await evaluate(`(() => { const button=[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!button)return false;button.focus();button.click();return true })()`);
        assert(clicked, `Acionador de formulário: ${label}`);
        await sleep(300);
        assert(await evaluate(`(() => { const panel=document.querySelector('[role="dialog"]');return !!panel && panel.contains(document.activeElement) && panel.scrollWidth<=panel.clientWidth && getComputedStyle(panel.parentElement).backdropFilter==='none' })()`), `Painel responsivo e acessível: ${label}, ${width}px`);
        assert(await evaluate(`(() => {const panel=document.querySelector('[role="dialog"]');return panel.parentElement.parentElement===document.body && panel.parentElement.contains(document.elementFromPoint(innerWidth/2,innerHeight-10))})()`), 'Modal cobre a navegação inferior');
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(output, `form-${forms.findIndex(f=>f[0]===route)}-${width}.png`), Buffer.from(shot.data, 'base64'));
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
      }
      await navigate('/transactions/new');
      assert(await evaluate(`!!document.querySelector('[role="dialog"] form')`), 'Formulário de transação');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    }
    console.log('Formulários: abertura, responsividade, Escape e erro de campo verificados.');
    await navigate('/dashboard');
    await evaluate(`document.querySelector('button[aria-label="Ocultar saldo"]')?.click()`);
    await sleep(100);
    assert(await evaluate(`!!document.querySelector('button[aria-label="Mostrar saldo"]')`), 'Ocultação do saldo');
    // Aciona o botão real do tema e verifica persistência após recarregar.
    await evaluate(`const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Ativar modo claro');b?.click()`);
    const expectedTheme = await evaluate(`document.documentElement.dataset.theme`);
    await navigate('/settings');
    assert.equal(await evaluate(`document.documentElement.dataset.theme`), expectedTheme, 'Persistência do tema');
    await navigate('/dashboard');
    const metrics = await evaluate(`({scripts:[...performance.getEntriesByType('resource')].filter(r=>r.name.includes('.js')).reduce((n,r)=>n+r.transferSize,0),nodes:document.querySelectorAll('*').length})`);
    await checkPreferences();
    await send('Network.deleteCookies', { name: 'fin_session', url: base });
    for (const width of [320,390,768,1024,1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await navigate('/login');
      for (const theme of ['light','dark']) {
        await evaluate(`document.documentElement.dataset.theme='${theme}';document.documentElement.classList.toggle('dark','${theme}'==='dark')`);
        assert(await evaluate(`!!document.querySelector('h1') && document.documentElement.scrollWidth <= innerWidth`), 'Login responsivo');
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(output, `login-${width}-${theme}.png`), Buffer.from(shot.data, 'base64'));
      }
    }
    await navigate('/rota-inexistente-qa');
    assert(await evaluate(`document.body.innerText.includes('Página não encontrada')`), 'Página 404');
    const reportName = process.env.QA_WIDTHS ? `report-${process.env.QA_WIDTHS}.json` : 'report.json';
    fs.writeFileSync(path.join(output, reportName), JSON.stringify({ results, failures, exceptions, metrics }, null, 2));
    console.log(JSON.stringify({ layouts: results.length, failures, exceptions, output }, null, 2));
    assert.equal(failures.length, 0, 'Falhas de layout ou estados de UI');
    assert.equal(exceptions.length, 0, 'Erros no navegador');
  } finally {
    await send('Page.close').catch(() => {});
    socket.close();
    await browserSend('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
    browserSocket.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
