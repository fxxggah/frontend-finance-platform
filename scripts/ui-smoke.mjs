// Validação visual com transporte controlado; não autentica nem altera o backend.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env.SMOKE_URL || 'http://localhost:3005';
const authOnly = process.argv.includes('--auth-only');
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = await mkdtemp(join(tmpdir(), 'fin-ui-'));
const port = 9227;
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'],
{ windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const spec = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
let socket;

try {
  let target;
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/json/new?about:blank`, { method: 'PUT' });
      target = await response.json();
      break;
    } catch { await sleep(100); }
  }
  assert.ok(target, 'Chrome não iniciou');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('close', event => {
    for (const callback of pending.values()) callback.reject(new Error(`CDP encerrado: ${event.code} ${event.reason}`));
    pending.clear();
  });
  const exceptions = [];
  const contractErrors = [];
  let refreshScenario = { status: 200, delay: 0 };
  let refreshCalls = 0;
  let privateCalls = 0;
  function send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const reference = today.slice(0, 7);
  function sample(schema, key = '') {
    if (schema.$ref) return sample(spec.components.schemas[schema.$ref.split('/').at(-1)], key);
    if (schema.enum) return schema.enum[0];
    if (schema.type === 'array') return [sample(schema.items)];
    if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.properties || {}).map(([name, value]) => [name, sample(value, name)]));
    if (schema.type === 'boolean') return false;
    if (schema.type === 'integer') return key === 'page' ? 0 : 1;
    if (schema.type === 'number') return key === 'totalBalance' ? 1234.56 : 12.34;
    if (schema.format === 'date') return today;
    if (key === 'pictureUrl') return null;
    if (key === 'reference' || key === 'invoiceReference') return reference;
    if (key === 'color') return '#123456';
    if (key === 'icon') return 'wallet';
    if (key === 'name' || key === 'categoryName') return 'Pessoa de Validação';
    return `Dado da API: ${key}`;
  }
  socket.addEventListener('message', async event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback?.reject(new Error(JSON.stringify(message.error)));
      else callback?.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    } else if (message.method === 'Fetch.requestPaused') {
      const { request, requestId } = message.params;
      const url = new URL(request.url);
      if (url.hostname === 'accounts.google.com') {
        await send('Fetch.fulfillRequest', {
          requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/javascript' }],
          body: Buffer.from(`window.google = { accounts: { id: {
            initialize(config) { this.callback = config.callback; },
            renderButton(element) { const button = document.createElement('button'); button.textContent = 'Entrar com Google (teste)'; button.onclick = () => this.callback({ credential: 'controlled-google-credential' }); element.appendChild(button); }
          } } };`).toString('base64'),
        });
        return;
      }
      let body;
      let status = 200;
      const headers = [];
      if (url.pathname === '/api/auth/refresh') {
        refreshCalls++;
        const scenario = refreshScenario;
        if (scenario.delay) await sleep(scenario.delay);
        status = scenario.status;
        body = status === 200 ? { accessToken: 'validation-access' } : { status, title: 'Falha de sessão', detail: 'Resposta controlada' };
        if (status === 401) headers.push({ name: 'Set-Cookie', value: 'fin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' });
      }
      else if (url.pathname === '/api/auth/session') {
        body = { accessToken: 'validation-access' };
        headers.push({ name: 'Set-Cookie', value: 'fin_session=validation-cookie; Path=/; HttpOnly; SameSite=Lax' });
      }
      else if (url.pathname === '/api/auth/logout') {
        body = { success: true };
        headers.push({ name: 'Set-Cookie', value: 'fin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' });
      }
      else if (request.method !== 'OPTIONS') {
        if (!url.pathname.startsWith('/api/v1/auth/')) privateCalls++;
        const route = Object.keys(spec.paths).find(route => new RegExp(`^${route.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(url.pathname));
        const operation = spec.paths[route]?.[request.method.toLowerCase()];
        if (!operation) contractErrors.push(`${request.method} ${url.pathname}`);
        const response = Object.entries(operation?.responses || {}).find(([status]) => Number(status) < 300)?.[1];
        const schema = Object.values(response?.content || {})[0]?.schema;
        body = schema ? sample(schema) : undefined;
      }
      await send('Fetch.fulfillRequest', {
        requestId, responseCode: status,
        responseHeaders: [
          ...headers,
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: origin },
          { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type,accept' },
          { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
        ],
        body: Buffer.from(body === undefined ? '' : JSON.stringify(body)).toString('base64'),
      }).catch(error => contractErrors.push(error.message));
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Fetch.enable', { patterns: [
    { urlPattern: 'http://localhost:8080/*' }, { urlPattern: `${origin}/api/auth/*` },
    { urlPattern: 'https://accounts.google.com/gsi/client*' },
  ] });
  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true });
    return response.result.value;
  }
  async function navigate(path) {
    await send('Page.navigate', { url: `${origin}${path}` });
    for (let i = 0; i < 80; i++) {
      await sleep(100);
      if (await evaluate(`document.readyState === 'complete' && document.body.innerText.includes('Pessoa de Validação') && !document.body.innerText.includes('Carregando perfil...')`)) return;
    }
    throw new Error(`Página não estabilizou: ${path}\n${await evaluate('document.body.innerText')}`);
  }
  async function waitFor(expression) {
    for (let i = 0; i < 100; i++) {
      await sleep(100);
      if (await evaluate(`document.readyState === 'complete' && (${expression})`)) return;
    }
    throw new Error(`Condição não atingida: ${expression}\n${await evaluate('document.body.innerText')}`);
  }
  async function setSessionCookie() {
    await send('Network.setCookie', { name: 'fin_session', value: 'validation-cookie', url: origin, httpOnly: true, sameSite: 'Lax' });
  }
  async function clickButton(text) {
    assert.ok(await evaluate(`(() => { const button = Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(text)}); button?.click(); return !!button; })()`), `Botão ausente: ${text}`);
  }
  const loginVisible = `location.pathname === '/login' && document.body.innerText.includes('Suas finanças, num só lugar')`;
  const sessionError = `document.body.innerText.includes('Não foi possível validar sua sessão')`;
  for (const width of [390, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 1024 });
    await send('Network.deleteCookies', { name: 'fin_session', url: origin });
    refreshCalls = 0;
    privateCalls = 0;
    for (const route of ['/', '/dashboard', '/login']) {
      await send('Page.navigate', { url: `${origin}${route}` });
      await waitFor(loginVisible);
    }
    assert.equal(refreshCalls, 0, 'Sem cookie não deve renovar');
    assert.equal(privateCalls, 0, 'Sem sessão não deve consultar dados privados');

    for (const route of ['/', '/dashboard', '/login']) {
      await setSessionCookie();
      refreshScenario = { status: 401, delay: 0 };
      await send('Page.navigate', { url: `${origin}${route}` });
      await waitFor(loginVisible);
      const cookies = await send('Network.getCookies', { urls: [origin] });
      assert.ok(!cookies.cookies.some(cookie => cookie.name === 'fin_session'), '401 deve remover cookie');
      assert.equal(privateCalls, 0);
    }

    for (const status of [503, 502]) {
      await setSessionCookie();
      refreshScenario = { status, delay: 500 };
      await send('Page.navigate', { url: `${origin}/dashboard` });
      await waitFor(`document.body.innerText.includes('Verificando sessão...')`);
      assert.equal(privateCalls, 0, 'Shell não pode consultar enquanto verifica');
      await waitFor(sessionError);
      assert.equal(privateCalls, 0, 'Falha de sessão não pode consultar dados privados');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'));
      assert.ok(await evaluate('Array.from(document.querySelectorAll("button")).every(button => button.getBoundingClientRect().height >= 44)'));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(profile, `auth-session-${status}-${width}.png`), Buffer.from(shot.data, 'base64'));
      const cookies = await send('Network.getCookies', { urls: [origin] });
      assert.ok(cookies.cookies.some(cookie => cookie.name === 'fin_session'), 'Falha temporária deve preservar cookie');
      await clickButton('Entrar novamente');
      await waitFor(loginVisible);
    }

    await setSessionCookie();
    refreshScenario = { status: 503, delay: 0 };
    await send('Page.navigate', { url: `${origin}/login` });
    await waitFor(sessionError);
    refreshScenario = { status: 200, delay: 0 };
    await clickButton('Tentar novamente');
    await waitFor(`location.pathname === '/dashboard' && document.body.innerText.includes('Pessoa de Validação')`);
    await navigate('/dashboard'); // Recarga recupera o token novamente.
    await navigate('/login'); // Cookie válido encaminha ao dashboard.
    assert.equal(await evaluate('location.pathname'), '/dashboard');
    assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'));
    for (const [state, expression] of [
      ['loading', `!!document.querySelector('[aria-label="Carregando início"]')`],
      ['empty', `document.body.innerText.includes('Seu próximo passo começa aqui')`],
      ['error', `document.body.innerText.includes('Não foi possível carregar seus dados')`],
    ]) {
      await navigate(`/dashboard?state=${state}`);
      await waitFor(expression);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(profile, `auth-dashboard-${state}-${width}.png`), Buffer.from(shot.data, 'base64'));
      console.log(`OK ${width}px dashboard autenticado ?state=${state}`);
    }

    await send('Network.deleteCookies', { name: 'fin_session', url: origin });
    await send('Page.navigate', { url: `${origin}/login` });
    await waitFor(loginVisible);
    if (!await evaluate(`document.body.innerText.includes('Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID')`)) {
      await waitFor(`document.body.innerText.includes('Entrar com Google (teste)')`);
      await clickButton('Entrar com Google (teste)');
      await waitFor(`location.pathname === '/dashboard' && document.body.innerText.includes('Pessoa de Validação')`);
      await navigate('/dashboard');
      console.log(`OK ${width}px login Google com transporte controlado e recarga`);
    } else console.log(`SKIP ${width}px login Google: client ID ausente`);
    console.log(`OK ${width}px sessão: sem cookie, 401, 502, 503, retry, logout e recarga`);
  }
  await setSessionCookie();
  if (!authOnly) for (const width of [390, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 1024 });
    for (const route of ['/dashboard', '/transactions', '/accounts', '/cards', '/goals', '/reports', '/categories', '/settings']) {
      await navigate(route);
      const text = await evaluate('document.body.innerText');
      assert.ok(!text.includes('Hellen'), `Perfil fictício em ${route}`);
      assert.ok(!text.includes('Erro ao carregar') && !text.includes('Não foi possível carregar'), `Falha em ${route}: ${text}`);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), `Overflow em ${route}, ${width}px`);
      if (route === '/dashboard') {
        await sleep(700);
        const brandStyles = await evaluate(`(() => {
          const root = document.documentElement;
          const originalTheme = root.getAttribute('data-theme');
          const hadDarkClass = root.classList.contains('dark');
          const card = document.querySelector('section[aria-label="Saldo e ações rápidas"]').firstElementChild;
          const fab = document.querySelector('nav[aria-label="Navegação mobile"] button[aria-label="Criar novo lançamento"]');
          function read() {
            const button = fab && getComputedStyle(fab);
            return {
              gradient: getComputedStyle(card).backgroundImage,
              fabGradient: button?.backgroundImage,
              fabBorder: button?.borderTopWidth,
              fabRadius: button?.borderTopLeftRadius,
              fabWidth: fab?.getBoundingClientRect().width,
            };
          }
          root.classList.remove('dark');
          root.setAttribute('data-theme', 'light');
          const light = read();
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
          const dark = read();
          root.classList.toggle('dark', hadDarkClass);
          if (originalTheme === null) root.removeAttribute('data-theme');
          else root.setAttribute('data-theme', originalTheme);
          return { light, dark };
        })()`);
        assert.match(brandStyles.light.gradient, /linear-gradient/);
        assert.equal(brandStyles.dark.gradient, brandStyles.light.gradient, 'O card de marca mudou de gradiente no tema escuro');
        if (width < 1024) {
          assert.equal(brandStyles.dark.fabGradient, brandStyles.light.fabGradient, 'O botão central mudou de gradiente');
          assert.equal(brandStyles.dark.fabBorder, '0px', 'O botão central deve ter borda limpa');
          assert.ok(parseFloat(brandStyles.dark.fabRadius) >= brandStyles.dark.fabWidth / 2, 'O botão central deve permanecer circular');
          assert.ok(brandStyles.dark.fabWidth >= 44, 'Área de toque do botão central insuficiente');
          await evaluate(`document.documentElement.setAttribute('data-theme', 'dark')`);
          const darkShot = await send('Page.captureScreenshot', { format: 'png' });
          await writeFile(join(profile, 'dashboard-dark-390.png'), Buffer.from(darkShot.data, 'base64'));
          await evaluate(`document.documentElement.removeAttribute('data-theme')`);
        }
        assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('main button[aria-pressed]'), button => button.textContent.trim())`), ['Dia', 'Semana', 'Mês', 'Ano', 'Personalizado']);
        assert.ok(await evaluate(`(() => {
          const section = document.querySelector('section[aria-label="Saldo e ações rápidas"]');
          const [balance, actions] = section.children;
          return Math.abs(actions.getBoundingClientRect().top - balance.getBoundingClientRect().bottom - 16) <= 1;
        })()`), 'Os atalhos devem ficar 16px abaixo do saldo');
        assert.ok(await evaluate(`document.body.innerText.includes('1.234,56')`), 'Saldo da resposta não foi exibido');
        assert.equal(await evaluate(`Array.from(document.querySelectorAll('header')).filter(element => getComputedStyle(element).display !== 'none').length`), 1);
        assert.ok(await evaluate(`document.querySelectorAll('.recharts-sector').length > 0`), 'Gráfico de categorias não foi desenhado');
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        await writeFile(join(profile, `dashboard-${width}.png`), Buffer.from(shot.data, 'base64'));
      }
      if (route === '/transactions') {
        assert.deepEqual(await evaluate(`Array.from(document.querySelector('select[aria-label="Período"]').options, option => option.value)`), ['DAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM']);
      }
      if (route === '/reports') {
        assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('main button[aria-pressed]'), button => button.textContent.trim())`), ['Dia', 'Semana', 'Mês', 'Ano', 'Personalizado']);
      }
      console.log(`OK ${width}px ${route}`);
    }
    for (const period of ['DAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM', 'FORTNIGHT', 'QUARTER', 'SEMESTER']) {
      await navigate(`/dashboard?period=${period}`);
      await sleep(100);
      const expected = ['FORTNIGHT', 'QUARTER', 'SEMESTER'].includes(period) ? 'MONTH' : period;
      assert.equal(await evaluate(`new URLSearchParams(location.search).get('period')`), expected);
      assert.equal(await evaluate(`document.querySelector('button[aria-pressed="true"]').textContent.trim()`), { DAY: 'Dia', WEEK: 'Semana', MONTH: 'Mês', YEAR: 'Ano', CUSTOM: 'Personalizado' }[expected]);
      if (expected === 'CUSTOM') assert.equal(await evaluate(`document.querySelectorAll('main input[type="date"]').length`), 2);
      console.log(`OK ${width}px período ${period} => ${expected}`);
    }
    for (const [state, expected] of [['loading', 'Carregando início'], ['empty', 'Nenhuma movimentação neste período'], ['error', 'Não foi possível carregar seus dados']]) {
      await navigate(`/dashboard?state=${state}`);
      assert.ok(await evaluate(`document.body.innerText.includes(${JSON.stringify(expected)}) || !!document.querySelector('[aria-label=' + ${JSON.stringify(JSON.stringify(expected))} + ']')`), `Estado inválido: ${state}`);
      console.log(`OK ${width}px dashboard ${state}`);
    }
    for (const route of ['/transactions', '/accounts', '/cards', '/goals', '/reports', '/categories']) {
      for (const state of ['loading', 'empty', 'error']) {
        await navigate(`${route}?state=${state}`);
        const valid = state === 'loading'
          ? await evaluate(`!!document.querySelector('.animate-pulse')`)
          : state === 'empty'
            ? await evaluate(`/Nenhum|Nenhuma/.test(document.body.innerText)`)
            : await evaluate(`/Erro ao carregar|Não foi possível|não foi possível/.test(document.body.innerText)`);
        assert.ok(valid, `Estado inválido: ${route} ${state}`);
        console.log(`OK ${width}px ${route} ${state}`);
      }
    }
    for (const route of ['/transactions/new?type=INCOME', `/cards/1/invoices/${reference}`, '/cards/1', '/goals/1']) {
      await navigate(route);
      assert.ok(!await evaluate(`/Erro ao carregar|Não foi possível carregar/.test(document.body.innerText)`), `Falha no detalhe: ${route}`);
      console.log(`OK ${width}px ${route}`);
    }
    for (const route of ['/simulations/investment', '/simulations/debt']) {
      await navigate(route);
      await evaluate(`document.querySelector('form').requestSubmit()`);
      await sleep(300);
      assert.ok(await evaluate(`/Resultado da Simulação/.test(document.body.innerText)`), `Simulação sem resultado: ${route}`);
      console.log(`OK ${width}px ${route} POST`);
    }
  }
  assert.deepEqual(contractErrors, []);
  assert.deepEqual(exceptions, []);
  console.log(`Capturas: ${profile}`);
} finally {
  socket?.close();
  chrome.kill();
}
