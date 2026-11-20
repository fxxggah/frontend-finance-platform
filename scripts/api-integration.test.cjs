const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
const originalFetch = global.fetch;
const originalWindow = global.window;
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalEnv = { mock: process.env.NEXT_PUBLIC_USE_MOCK, url: process.env.NEXT_PUBLIC_API_URL };
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
function sessionLocks() {
  let queued;
  return {
    request(name, { mode }, action) {
      assert.equal(name, 'fin:auth-session');
      assert.equal(mode, 'exclusive');
      const result = queued ? queued.then(action) : action();
      const tail = result.catch(() => {});
      queued = tail;
      tail.then(() => { if (queued === tail) queued = undefined; });
      return result;
    },
  };
}

function reset({ locks = true } = {}) {
  for (const key of Object.keys(require.cache)) {
    if (['lib', 'app'].some(directory => key.startsWith(path.join(root, directory)))) delete require.cache[key];
  }
  process.env.NEXT_PUBLIC_USE_MOCK = 'false';
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: locks ? { locks: sessionLocks() } : {} });
  const redirects = [];
  global.window = { location: { pathname: '/dashboard', assign: value => redirects.push(value) } };
  return { client: require('../lib/api/client.ts'), redirects };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('pagamento antecipado envia somente o contrato e preserva erros ProblemDetail', async () => {
  const { client } = reset();
  client.setAccessToken('invoice-test');
  const cards = require('../lib/api/endpoints/credit-cards.ts');
  const payment = { accountId: 1, amount: 400, date: '2026-10-20' };
  global.fetch = async (input, init) => {
    assert.equal(String(input), 'http://localhost:8080/api/v1/credit-cards/1/invoices/2026-10/payments');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), payment);
    return new Response(null, { status: 201 });
  };
  await cards.payInvoice(1, '2026-10', payment);
  global.fetch = async () => json({ status: 422, title: 'Unprocessable Content', detail: 'O valor do pagamento não pode ser maior que o saldo restante da fatura.' }, 422);
  await assert.rejects(cards.payInvoice(1, '2026-10', payment), error => error.status === 422 && error.detail.includes('saldo restante'));
});

test('mock permite antecipações sucessivas, preserva OPEN e recalcula status no estorno', async () => {
  reset();
  process.env.NEXT_PUBLIC_USE_MOCK = 'true';
  delete require.cache[require.resolve('../lib/config.ts')];
  const cards = require('../lib/api/endpoints/credit-cards.ts');
  const request = amount => ({ accountId: 1, amount, date: '2026-10-20' });
  let invoice = await cards.getInvoiceDetail(1, '2026-11');
  assert.equal(invoice.status, 'OPEN');
  await cards.payInvoice(1, invoice.reference, request(400));
  invoice = await cards.getInvoiceDetail(1, invoice.reference);
  assert.equal(invoice.paid, 400);
  assert.equal(invoice.status, 'OPEN');
  await assert.rejects(cards.payInvoice(1, invoice.reference, request(230.01)), error => error.status === 422);
  await cards.payInvoice(1, invoice.reference, request(229.99));
  invoice = await cards.getInvoiceDetail(1, invoice.reference);
  assert.equal(invoice.paid, 629.99);
  assert.equal(invoice.status, 'OPEN');
  await cards.payInvoice(1, invoice.reference, request(0.01));
  invoice = await cards.getInvoiceDetail(1, invoice.reference);
  assert.equal(invoice.paid, invoice.total);
  assert.equal(invoice.status, 'OPEN');
  await assert.rejects(cards.payInvoice(1, invoice.reference, request(0.01)), error => error.status === 422);
  for (const amount of [0, -1]) {
    await assert.rejects(cards.payInvoice(1, invoice.reference, request(amount)), error => error.status === 400);
  }
  for (const payment of invoice.payments) await cards.deleteInvoicePayment(1, invoice.reference, payment.id);
  invoice = await cards.getInvoiceDetail(1, invoice.reference);
  assert.equal(invoice.paid, 0);
  assert.equal(invoice.status, 'OPEN');
  assert.equal(invoice.payments.length, 0);
  // As fixtures originais não podem ser alteradas pelas mutações do transporte mock.
  assert.equal(require('../lib/mock-data.ts').mockInvoices[0].paid, 0);
  await cards.payInvoice(1, '2026-10', request(780.49));
  invoice = await cards.getInvoiceDetail(1, '2026-10');
  assert.equal(invoice.status, 'PARTIALLY_PAID');
  await cards.payInvoice(1, invoice.reference, request(0.01));
  invoice = await cards.getInvoiceDetail(1, invoice.reference);
  assert.equal(invoice.status, 'PAID');
  const payment = invoice.payments.at(-1);
  await cards.deleteInvoicePayment(1, invoice.reference, payment.id);
  assert.equal((await cards.getInvoiceDetail(1, invoice.reference)).status, 'PARTIALLY_PAID');
  invoice = await cards.getInvoiceDetail(1, invoice.reference);
  for (const item of invoice.payments) await cards.deleteInvoicePayment(1, invoice.reference, item.id);
  assert.equal((await cards.getInvoiceDetail(1, invoice.reference)).status, 'CLOSED');
  await cards.deleteInvoicePayment(1, '2026-09', 2);
  assert.equal((await cards.getInvoiceDetail(1, '2026-09')).status, 'OVERDUE');
});

test('configuração exige true explícito e normaliza a URL sem duplicar /api/v1', () => {
  for (const [value, expected] of [[undefined, false], ['false', false], ['true', true], ['TRUE', false]]) {
    reset();
    if (value === undefined) delete process.env.NEXT_PUBLIC_USE_MOCK;
    else process.env.NEXT_PUBLIC_USE_MOCK = value;
    delete require.cache[require.resolve('../lib/config.ts')];
    assert.equal(require('../lib/config.ts').USE_MOCK, expected);
  }
  for (const url of ['http://localhost:8080', 'http://localhost:8080/', 'http://localhost:8080/api/v1/']) {
    reset();
    process.env.NEXT_PUBLIC_API_URL = url;
    delete require.cache[require.resolve('../lib/config.ts')];
    assert.equal(require('../lib/config.ts').API_BASE_URL, 'http://localhost:8080/api/v1');
  }
});

test('requisições paralelas recuperam a sessão uma vez e enviam apenas access token no Bearer', async () => {
  const { client } = reset();
  let refreshes = 0;
  global.fetch = async (input, init) => {
    if (String(input) === '/api/auth/refresh') {
      refreshes++;
      await new Promise(resolve => setImmediate(resolve));
      return json({ accessToken: 'access-from-session' });
    }
    assert.equal(init.headers.get('Authorization'), 'Bearer access-from-session');
    return json({ source: 'transport' });
  };
  const results = await Promise.all([client.apiFetch('/users/me'), client.apiFetch('/dashboard/summary')]);
  assert.equal(refreshes, 1);
  assert.ok(results.every(result => result.source === 'transport'));
});

test('401 renova uma vez; segundo 401 encerra a sessão sem loop', async () => {
  const { client, redirects } = reset();
  client.setAccessToken('expired-access');
  let privateCalls = 0;
  let refreshes = 0;
  global.fetch = async input => {
    if (String(input) === '/api/auth/refresh') { refreshes++; return json({ accessToken: 'renewed-access' }); }
    if (String(input) === '/api/auth/logout') return json({ success: true });
    privateCalls++;
    return json({ title: 'Unauthorized', detail: 'Token inválido' }, 401);
  };
  await assert.rejects(client.apiFetch('/users/me'), error => error.status === 401);
  assert.equal(privateCalls, 2);
  assert.equal(refreshes, 1);
  assert.equal(client.getAccessToken(), null);
  assert.deepEqual(redirects, ['/login']);
});

test('indisponibilidade no refresh preserva a navegação e não envia consulta anônima', async () => {
  const { client, redirects } = reset();
  let calls = 0;
  global.fetch = async () => { calls++; return json({ detail: 'Temporariamente indisponível' }, 503); };
  await assert.rejects(client.apiFetch('/users/me'), error => error.status === 503);
  assert.equal(calls, 1);
  assert.deepEqual(redirects, []);
});

test('renovação pendente não restaura o token depois do logout', async () => {
  const { client } = reset();
  let finish;
  global.fetch = () => new Promise(resolve => { finish = resolve; });
  const request = client.apiFetch('/users/me');
  client.setAccessToken(null);
  finish(json({ accessToken: 'late-access' }));
  await assert.rejects(request, error => error.status === 401);
  assert.equal(client.getAccessToken(), null);
});

test('navegador sem Web Locks pede novo login sem tentar renovar o cookie', async () => {
  const { client } = reset({ locks: false });
  const requests = [];
  global.fetch = async input => { requests.push(String(input)); return json({ success: true }); };
  await assert.rejects(client.ensureAccessToken(), error =>
    error.status === 401 && error.code === client.SESSION_REAUTH_REQUIRED);
  assert.deepEqual(requests, []);
  await require('../lib/api/endpoints/auth.ts').logout();
  assert.deepEqual(requests, ['/api/auth/logout']);
});

const fixtureJwt = sub => "fixture." + Buffer.from(JSON.stringify({sub})).toString("base64url") + ".signed";

test("refresh com outro subject bloqueia o replay de uma mutação", async () => {
  const { client, redirects } = reset();
  const sessions = [];
  client.setAccessToken(fixtureJwt("10"));
  global.fetch = async (input, init) => {
    if (String(input) === "/api/auth/refresh") return json({ accessToken: fixtureJwt("20") });
    sessions.push(init.headers.get("Authorization"));
    return json({}, 401);
  };
  await assert.rejects(client.apiFetch("/transactions", {method:"POST", body:"{}"}),
    error => error.code === client.SESSION_CHANGED);
  assert.deepEqual(sessions, ["Bearer " + fixtureJwt("10")]);
  assert.equal(client.getAccessToken(), null);
  assert.deepEqual(redirects, []);
});

test("uma resposta antiga é descartada após mudança de sessão em outra aba", async () => {
  const { client } = reset();
  let epoch = "first";
  let reply;
  global.window.localStorage = { getItem: () => epoch };
  client.setAccessToken(fixtureJwt("10"));
  global.fetch = async () => new Promise(resolve => { reply = resolve; });
  const pending = client.apiFetch("/users/me");
  epoch = "second";
  reply(json({id:10}));
  await assert.rejects(pending, error => error.code === client.SESSION_CHANGED);
  assert.equal(client.getAccessToken(), null);
});

test("uma aba desatualizada não revoga a sessão da outra", async () => {
  const { client } = reset();
  let epoch = "first";
  global.window.localStorage = {getItem: () => epoch};
  client.setAccessToken(fixtureJwt("10"));
  epoch = "second";
  let calls = 0;
  global.fetch = async () => { calls++; return json({success:true}); };
  await assert.rejects(client.endSession(), error => error.code === client.SESSION_CHANGED);
  assert.equal(calls, 0);
});

test('ProblemDetail mantém erros de campo e mutações aceitam 200/201 sem corpo', async () => {
  const { client } = reset();
  client.setAccessToken('access');
  global.fetch = async () => json({ detail: 'Dados inválidos', errors: [{ field: 'amount', message: 'Informe o valor' }] }, 400);
  await assert.rejects(client.apiFetch('/transactions'), error => error.getFieldError('amount') === 'Informe o valor');
  for (const status of [200, 201, 204]) {
    global.fetch = async () => new Response(null, { status });
    assert.equal(await client.apiFetch('/auth/logout', { method: 'POST' }), undefined);
  }
});

test('serviços reais respeitam rotas, métodos, queries e payloads do OpenAPI atual', async () => {
  const { client } = reset();
  client.setAccessToken('access');
  const spec = JSON.parse(fs.readFileSync(path.join(root, 'openapi.json'), 'utf8'));
  const visited = new Set();
  function sample(schema, key = '') {
    if (schema.$ref) return sample(spec.components.schemas[schema.$ref.split('/').at(-1)], key);
    if (schema.enum) return schema.enum[0];
    if (schema.type === 'array') return [sample(schema.items)];
    if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.properties || {}).map(([name, value]) => [name, sample(value, name)]));
    if (schema.type === 'integer' || schema.type === 'number') return key === 'page' ? 0 : 1;
    if (schema.type === 'boolean') return false;
    if (schema.format === 'date') return '2026-11-11';
    if (key === 'reference' || key === 'invoiceReference') return '2026-11';
    if (key === 'color') return '#123456';
    if (key === 'icon') return 'wallet';
    return `api-${key}`;
  }
  global.fetch = async (input, init) => {
    const url = new URL(input);
    const template = Object.keys(spec.paths).find(route => new RegExp(`^${route.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(url.pathname));
    assert.ok(template, `Rota ausente do OpenAPI: ${url.pathname}`);
    const method = (init.method || 'GET').toLowerCase();
    const operation = spec.paths[template][method];
    assert.ok(operation, `Método ausente do OpenAPI: ${method} ${template}`);
    for (const key of url.searchParams.keys()) assert.ok(operation.parameters?.some(param => param.in === 'query' && param.name === key), `Query não documentada: ${key}`);
    if (init.body) {
      const request = JSON.parse(init.body);
      const ref = operation.requestBody.content['application/json'].schema.$ref;
      const schema = spec.components.schemas[ref.split('/').at(-1)];
      for (const key of Object.keys(request)) assert.ok(key in schema.properties, `Campo não documentado: ${key}`);
      for (const key of schema.required || []) assert.ok(key in request, `Campo obrigatório ausente: ${key}`);
    }
    assert.equal(init.headers.get('Authorization'), 'Bearer access');
    visited.add(`${method} ${template}`);
    const [status, response] = Object.entries(operation.responses).find(([status]) => Number(status) < 300);
    const schema = Object.values(response.content || {})[0]?.schema;
    return schema ? json(sample(schema), Number(status)) : new Response(null, { status: Number(status) });
  };
  const auth = require('../lib/api/endpoints/auth.ts');
  const accounts = require('../lib/api/endpoints/accounts.ts');
  const dashboard = require('../lib/api/endpoints/dashboard.ts');
  const transactions = require('../lib/api/endpoints/transactions.ts');
  const transfers = require('../lib/api/endpoints/transfers.ts');
  const categories = require('../lib/api/endpoints/categories.ts');
  const goals = require('../lib/api/endpoints/goals.ts');
  const cards = require('../lib/api/endpoints/credit-cards.ts');
  const simulations = require('../lib/api/endpoints/simulations.ts');
  assert.equal((await auth.getMe()).name, 'api-name');
  await accounts.listAccounts(); await accounts.getAccount(1);
  await accounts.createAccount({ name: 'Conta', type: 'BANK', initialBalance: 0 });
  await accounts.updateAccount(1, { name: 'Conta', type: 'BANK' }); await accounts.deleteAccount(1);
  await dashboard.getSummary('CUSTOM', undefined, { from: '2026-11-01', to: '2026-11-11', accountId: 1 });
  await dashboard.getExpensesByCategory(); await dashboard.getEvolution(); await dashboard.getRecentTransactions();
  await transactions.listTransactions({ q: 'texto', from: '2026-11-01', to: '2026-11-11' });
  const transaction = { type: 'INCOME', amount: 1, date: '2026-11-11', categoryId: 1, accountId: 1 };
  await transactions.createTransaction(transaction); await transactions.updateTransaction(1, transaction); await transactions.deleteTransaction(1);
  await transfers.listTransfers();
  const transfer = { fromAccountId: 1, toAccountId: 2, amount: 1, date: '2026-11-11' };
  await transfers.createTransfer(transfer); await transfers.updateTransfer(1, transfer); await transfers.deleteTransfer(1);
  await categories.listCategories(); await categories.createCategory({ name: 'Categoria', type: 'INCOME' });
  await categories.updateCategory(1, { name: 'Categoria' }); await categories.deleteCategory(1);
  await goals.listGoals(); await goals.getGoal(1);
  const goal = { name: 'Meta', type: 'SAVINGS', targetAmount: 1 };
  await goals.createGoal(goal); await goals.updateGoal(1, goal); await goals.cancelGoal(1); await goals.deleteGoal(1);
  await goals.listGoalContributions(1); await goals.addGoalContribution(1, { amount: 1, date: '2026-11-11' }); await goals.deleteGoalContribution(1, 1);
  await cards.listCreditCards(); await cards.getCreditCard(1); await cards.listInvoices(1); await cards.getInvoiceDetail(1, '2026-11');
  const card = { name: 'Cartão', creditLimit: 1, closingDay: 1, dueDay: 2 };
  await cards.createCreditCard(card); await cards.updateCreditCard(1, card); await cards.deleteCreditCard(1);
  await cards.payInvoice(1, '2026-11', { accountId: 1, amount: 1, date: '2026-11-11' }); await cards.deleteInvoicePayment(1, '2026-11', 1);
  await simulations.simulateInvestment({ initialAmount: 1, monthlyContribution: 1, annualRate: 1, years: 1 });
  await simulations.simulateDebt({ debtAmount: 1, monthlyRate: 1, monthlyPayment: 1 });
  await auth.deleteMe();
  assert.ok(visited.has('get /api/v1/dashboard/recent-transactions'));
  assert.ok(visited.size >= 35);
});

test('erros do backend nunca viram uma resposta mockada no modo real', async () => {
  const { client } = reset();
  client.setAccessToken('access');
  global.fetch = async () => json({ title: 'Falha', detail: 'Backend indisponível' }, 500);
  const { getSummary } = require('../lib/api/endpoints/dashboard.ts');
  await assert.rejects(getSummary(), error => error.status === 500 && error.detail === 'Backend indisponível');
});

test('barreira recupera sessão sem redirecionar e compartilha refresh com consultas', async () => {
  const { client, redirects } = reset();
  let calls = 0;
  global.fetch = async input => {
    if (String(input) === '/api/auth/refresh') {
      calls++;
      await new Promise(resolve => setImmediate(resolve));
      return json({ accessToken: 'validated-access' });
    }
    return json({ name: 'Pessoa' });
  };
  await Promise.all([client.ensureAccessToken(), client.ensureAccessToken(), client.apiFetch('/users/me')]);
  await client.ensureAccessToken();
  assert.equal(calls, 1);
  assert.equal(client.getAccessToken(), 'validated-access');
  assert.deepEqual(redirects, []);
  client.setAccessToken(null);
  global.fetch = async () => json({ detail: 'Expirou' }, 401);
  await assert.rejects(client.ensureAccessToken(), error => error.status === 401);
  assert.deepEqual(redirects, [], 'A barreira deve decidir a navegação inicial');
  await assert.rejects(client.apiFetch('/users/me'), error => error.status === 401);
  assert.deepEqual(redirects, ['/login']);
});

test('resposta incompleta ou JSON inválido no BFF não autentica o cliente', async () => {
  for (const response of [json({}), json({ accessToken: 123 }), new Response('invalid-json')]) {
    const { client } = reset();
    global.fetch = async () => response;
    await assert.rejects(client.ensureAccessToken(), error => error.status === 502);
    assert.equal(client.getAccessToken(), null);
  }
});

function authRequest(operation, { cookie = 'private-refresh-token', origin = 'http://localhost:3005', body } = {}) {
  const { NextRequest } = require('next/server');
  return new NextRequest(`http://localhost:3005/api/auth/${operation}`, {
    method: 'POST',
    headers: { origin, ...(cookie ? { cookie: `fin_session=${cookie}` } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test('BFF sem cookie rejeita sem chamar backend e bloqueia origem externa', async () => {
  reset();
  const { POST } = require('../app/api/auth/refresh/route.ts');
  global.fetch = async () => { throw new Error('Backend não deveria ser chamado'); };
  const response = await POST(authRequest('refresh', { cookie: null }));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).status, 401);
  assert.equal(response.cookies.get('fin_session').value, '');
  const forbidden = await POST(authRequest('refresh', { origin: 'https://external.example' }));
  assert.equal(forbidden.status, 403);
});

test('BFF rotaciona cookie httpOnly e devolve somente access token', async () => {
  reset();
  global.fetch = async (input, init) => {
    assert.equal(String(input), 'http://localhost:8080/api/v1/auth/refresh');
    assert.deepEqual(JSON.parse(init.body), { refreshToken: 'private-refresh-token' });
    assert.ok(init.signal instanceof AbortSignal);
    return json({ accessToken: 'new-access', refreshToken: 'rotated-private-token', expiresIn: 900 });
  };
  const { POST } = require('../app/api/auth/refresh/route.ts');
  const response = await POST(authRequest('refresh'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accessToken: 'new-access' });
  assert.equal(response.cookies.get('fin_session').value, 'rotated-private-token');
  assert.match(response.headers.get('set-cookie'), /httponly/i);
});

test('refresh e criação de sessão classificam falhas sem expor segredos', async t => {
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  for (const operation of ['refresh', 'session']) {
    for (const [upstream, expected, category] of [[400, 401, 'rejected'], [401, 401, 'rejected'], [503, 503, 'upstream_http'], [403, 502, 'upstream_http'], [200, 502, 'invalid_response'], ['network', 503, 'network'], ['json', 502, 'invalid_response']]) {
      reset();
      global.fetch = async () => {
        if (upstream === 'network') throw new Error('private-refresh-token');
        if (upstream === 'json') return new Response('invalid-json');
        return json({ detail: 'private-refresh-token' }, upstream);
      };
      const { POST } = require(`../app/api/auth/${operation}/route.ts`);
      const response = await POST(authRequest(operation, { body: { refreshToken: 'private-refresh-token' } }));
      assert.equal(response.status, expected, `${operation}: ${upstream}`);
      const problem = await response.json();
      assert.equal(problem.status, expected);
      assert.equal(problem.type, 'about:blank');
      assert.equal(response.cookies.get('fin_session')?.value, expected === 401 ? '' : undefined);
      assert.equal(logs.at(-1)[1].category, category);
      assert.equal(logs.at(-1)[1].operation, operation);
      assert.ok(!JSON.stringify(problem).includes('private-refresh-token'));
    }
  }
  assert.ok(!JSON.stringify(logs).includes('private-refresh-token'));
});

test('mock inválido retorna 401 e remove o cookie', async t => {
  reset();
  t.mock.method(console, 'error', () => {});
  process.env.NEXT_PUBLIC_USE_MOCK = 'true';
  delete require.cache[require.resolve('../lib/config.ts')];
  const { POST } = require('../app/api/auth/refresh/route.ts');
  const response = await POST(authRequest('refresh'));
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get('fin_session').value, '');
});

test('timeout de 10s preserva sessão no refresh e logout limpa cookie apesar da falha remota', async t => {
  reset();
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  t.mock.method(AbortSignal, 'timeout', duration => {
    assert.equal(duration, 10_000);
    const controller = new AbortController();
    controller.abort();
    return controller.signal;
  });
  global.fetch = async (_input, init) => { init.signal.throwIfAborted(); };
  const refresh = require('../app/api/auth/refresh/route.ts');
  const response = await refresh.POST(authRequest('refresh'));
  assert.equal(response.status, 503);
  assert.equal(response.cookies.get('fin_session'), undefined);
  assert.equal(logs.at(-1)[1].category, 'timeout');
  const logout = require('../app/api/auth/logout/route.ts');
  const ended = await logout.POST(authRequest('logout'));
  assert.equal(ended.status, 200);
  assert.equal(ended.cookies.get('fin_session').value, '');
  assert.equal(logs.at(-1)[1].operation, 'logout');
});

test('logout invalida refresh pendente antes de concluir a chamada remota', async () => {
  const { client } = reset();
  const auth = require('../lib/api/endpoints/auth.ts');
  let completeRefresh;
  let completeLogout;
  global.fetch = input => new Promise(resolve => {
    if (String(input) === '/api/auth/refresh') completeRefresh = resolve;
    else completeLogout = resolve;
  });
  const pending = client.ensureAccessToken();
  const ending = auth.logout();
  assert.equal(completeLogout, undefined);
  completeRefresh(json({ accessToken: 'late-access' }));
  await assert.rejects(pending, error => error.status === 401);
  assert.equal(client.getAccessToken(), null);
  await Promise.resolve();
  completeLogout(json({ success: true }));
  await ending;
});

after(() => {
  global.fetch = originalFetch;
  global.window = originalWindow;
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
  Module._resolveFilename = originalResolve;
  for (const [key, value] of [['NEXT_PUBLIC_USE_MOCK', originalEnv.mock], ['NEXT_PUBLIC_API_URL', originalEnv.url]]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

test('voz envia bytes originais, JWT e chave sem criar transação', async () => {
  const { client } = reset(); client.setAccessToken('voice-access');
  const voice = require('../lib/api/endpoints/voice.ts');
  const audio = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm;codecs=opus' });
  const expected = { description: 'Compra na padaria', type: null, amount: 45.01, date: '2026-11-16', categoryId: 2, accountId: null,
    creditCardId: 1, installments: 1, missingFields: ['type'], requiresConfirmation: true };
  let calls = 0;
  global.fetch = async (input, init) => {
    calls++;
    assert.equal(String(input), 'http://localhost:8080/api/v1/ai/transaction-drafts');
    assert.equal(init.method, 'POST'); assert.equal(init.body, audio);
    assert.equal(init.headers.get('Content-Type'), 'audio/webm');
    assert.equal(init.headers.get('Idempotency-Key'), 'voice-test-key-1');
    assert.equal(init.headers.get('Authorization'), 'Bearer voice-access');
    assert.deepEqual(Array.from(new Uint8Array(await init.body.arrayBuffer())), [1, 2, 3, 4]);
    return json(expected);
  };
  assert.deepEqual(await voice.createVoiceDraft(audio, 'voice-test-key-1'), expected);
  assert.equal(calls, 1);
});

test('voz preserva códigos e Retry-After sem repetir falhas', async () => {
  const { client } = reset(); client.setAccessToken('voice-errors');
  const voice = require('../lib/api/endpoints/voice.ts');
  const audio = new Blob(['synthetic'], { type: 'audio/mp4' });
  for (const [status, code] of [[403, 'PRO_REQUIRED'], [409, 'AI_REQUEST_ALREADY_USED'],
    [422, 'MULTIPLE_TRANSACTIONS'], [429, 'USER_AI_QUOTA_EXCEEDED'], [503, 'AI_RATE_LIMITED']]) {
    let calls = 0;
    global.fetch = async () => { calls++; return new Response(JSON.stringify({ status, title: 'Teste', detail: 'Falha controlada', code }),
      { status, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': '30' } }); };
    await assert.rejects(voice.createVoiceDraft(audio, 'voice-test-key-2'), error =>
      error.status === status && error.code === code && error.retryAfterSeconds === 30);
    assert.equal(calls, 1);
  }
  const { parseRetryAfter } = require('../lib/api/errors.ts');
  assert.equal(parseRetryAfter('Mon, 16 Nov 2026 12:00:30 GMT', Date.parse('2026-11-16T12:00:00Z')), 30);
  assert.equal(parseRetryAfter('invalid'), undefined);
});

test('refresh 401 da voz reutiliza o mesmo Blob e a mesma chave', async () => {
  const { client } = reset(); client.setAccessToken('old-voice-token');
  const voice = require('../lib/api/endpoints/voice.ts');
  const audio = new Blob(['synthetic'], { type: 'audio/webm' });
  let voiceCalls = 0, refreshCalls = 0;
  global.fetch = async (input, init) => {
    if (String(input) === '/api/auth/refresh') { refreshCalls++; return json({ accessToken: 'new-voice-token' }); }
    voiceCalls++;
    assert.equal(init.body, audio); assert.equal(init.headers.get('Idempotency-Key'), 'voice-test-key-3');
    if (voiceCalls === 1) return json({ status: 401, title: 'Unauthorized', detail: 'Expire' }, 401);
    assert.equal(init.headers.get('Authorization'), 'Bearer new-voice-token');
    return json({ description: 'Compra na padaria', type: 'EXPENSE', amount: 45.01, date: '2026-11-16', categoryId: 2, accountId: 1,
      creditCardId: null, installments: 1, missingFields: [], requiresConfirmation: true });
  };
  await voice.createVoiceDraft(audio, 'voice-test-key-3');
  assert.equal(voiceCalls, 2); assert.equal(refreshCalls, 1);
});

test('voz recusa resposta inválida e formatos/tamanho locais sem fallback para dados inventados', async () => {
  const { client } = reset(); client.setAccessToken('voice-validation');
  const voice = require('../lib/api/endpoints/voice.ts');
  let calls = 0;
  global.fetch = async () => { calls++; return json({ requiresConfirmation: false, private: 'fixture' }); };
  await assert.rejects(voice.createVoiceDraft(new Blob(['x'], { type: 'audio/webm' }), 'voice-test-key-4'),
    error => error.status === 502 && !error.detail.includes('fixture'));
  assert.equal(calls, 1); calls = 0;
  for (const audio of [new Blob([]), new Blob(['x'], { type: 'audio/ogg' }),
    new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: 'audio/webm' })]) {
    await assert.rejects(voice.createVoiceDraft(audio, 'voice-test-key-5'), error => error.status === 422);
  }
  assert.equal(calls, 0);
});

test('flag de voz é opt-in e não ativa voz real no modo mock', () => {
  reset();
  const original = process.env.NEXT_PUBLIC_VOICE_PILOT_ENABLED;
  const config = () => { delete require.cache[require.resolve('../lib/config.ts')]; return require('../lib/config.ts'); };
  try {
    delete process.env.NEXT_PUBLIC_VOICE_PILOT_ENABLED; assert.equal(config().VOICE_PILOT_ENABLED, false);
    process.env.NEXT_PUBLIC_VOICE_PILOT_ENABLED = 'true'; assert.equal(config().VOICE_PILOT_ENABLED, true);
    process.env.NEXT_PUBLIC_USE_MOCK = 'true'; assert.equal(config().VOICE_PILOT_ENABLED, false);
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_VOICE_PILOT_ENABLED;
    else process.env.NEXT_PUBLIC_VOICE_PILOT_ENABLED = original;
    process.env.NEXT_PUBLIC_USE_MOCK = 'false'; config();
  }
});

test('checkout e portal enviam só JWT/chave e aceitam apenas URLs hospedadas na Stripe', async () => {
  const { client } = reset(); client.setAccessToken('billing-fixture');
  const billing = require('../lib/api/endpoints/billing.ts');
  const requests = [];
  global.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    assert.equal(init.method, 'POST'); assert.equal(init.body, undefined);
    assert.equal(init.headers.get('Authorization'), 'Bearer billing-fixture');
    return json({ url: String(input).endsWith('checkout-sessions') ? 'https://checkout.stripe.com/c/pay/fixture' : 'https://billing.stripe.com/p/fixture' });
  };
  assert.equal(await billing.createCheckout('billing-test-key'), 'https://checkout.stripe.com/c/pay/fixture');
  assert.equal(await billing.createBillingPortal(), 'https://billing.stripe.com/p/fixture');
  assert.equal(requests[0].init.headers.get('Idempotency-Key'), 'billing-test-key');
  assert.equal(requests[1].init.headers.has('Idempotency-Key'), false);
  assert.ok(requests.every(r => !r.url.includes('?')));
});

test('assinatura valida plano e status do servidor sem derivar PRO do retorno do checkout', async () => {
  const { client } = reset(); client.setAccessToken('billing-state');
  const billing = require('../lib/api/endpoints/billing.ts');
  global.fetch = async (input, init) => {
    assert.equal(init.body, undefined);
    return json(String(input).endsWith('/plan') ? { amount: 39.9, currency: 'BRL', interval: 'MONTH', testMode: true }
      : { status: 'NONE', paidUntil: null, manualProExpiresAt: null, effectiveProExpiresAt: null,
          cancelAtPeriodEnd: false, canCheckout: true, canManage: false, reviewRequired: false, testMode: true });
  };
  assert.equal((await billing.getBillingPlan()).amount, 39.9);
  assert.equal((await billing.getBillingStatus()).paidUntil, null);
  global.fetch = async () => json({ amount: 0.01, currency: 'USD', interval: 'MONTH', testMode: false });
  await assert.rejects(billing.getBillingPlan(), e => e.status === 502);
});

test('billing recusa redirecionamentos externos, HTTP e credenciais na URL', async () => {
  const { client } = reset(); client.setAccessToken('billing-redirect');
  const billing = require('../lib/api/endpoints/billing.ts');
  for (const url of ['https://evil.example/checkout', 'http://checkout.stripe.com/c/pay/x', 'https://checkout.stripe.com.evil.example/x', 'https://user:pass@checkout.stripe.com/x', 'https://billing.stripe.com/p/x']) {
    global.fetch = async () => json({ url });
    await assert.rejects(billing.createCheckout('billing-key-url'), e => e.status === 502);
  }
});

test('billing mantém chave no replay 401 e não repete erro de cobrança automaticamente', async () => {
  const { client } = reset(); client.setAccessToken('billing-old');
  const billing = require('../lib/api/endpoints/billing.ts');
  let calls = 0;
  global.fetch = async (input, init) => {
    if (String(input) === '/api/auth/refresh') return json({ accessToken: 'billing-new' });
    calls++; assert.equal(init.headers.get('Idempotency-Key'), 'billing-intent');
    return calls === 1 ? json({ status: 401, title: 'Expired' }, 401) : json({ url: 'https://checkout.stripe.com/c/pay/fixture' });
  };
  await billing.createCheckout('billing-intent'); assert.equal(calls, 2);
  calls = 0;
  global.fetch = async () => { calls++; return json({ status: 409, title: 'Aguarde', detail: 'Operação em andamento', code: 'BILLING_OPERATION_IN_PROGRESS' }, 409); };
  await assert.rejects(billing.createCheckout('billing-intent'), e => e.code === 'BILLING_OPERATION_IN_PROGRESS');
  assert.equal(calls, 1);
});

test('billing é opt-in e mocks não criam sessões de pagamento', async () => {
  reset(); const original = process.env.NEXT_PUBLIC_BILLING_ENABLED;
  try {
    delete process.env.NEXT_PUBLIC_BILLING_ENABLED; delete require.cache[require.resolve('../lib/config.ts')];
    assert.equal(require('../lib/config.ts').BILLING_PILOT_ENABLED, false);
    process.env.NEXT_PUBLIC_BILLING_ENABLED = 'true'; process.env.NEXT_PUBLIC_USE_MOCK = 'true';
    delete require.cache[require.resolve('../lib/config.ts')];
    assert.equal(require('../lib/config.ts').BILLING_PILOT_ENABLED, false);
    let calls=0; global.fetch=async()=>{calls++;throw new Error('Não deve chamar');};
    const billing=require('../lib/api/endpoints/billing.ts');
    await assert.rejects(billing.createCheckout('billing-mock'),e=>e.status===503); assert.equal(calls,0);
  } finally { if(original === undefined) delete process.env.NEXT_PUBLIC_BILLING_ENABLED; else process.env.NEXT_PUBLIC_BILLING_ENABLED=original; }
});