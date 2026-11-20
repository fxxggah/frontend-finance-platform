import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import ts from 'typescript';

const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const modules = await Promise.all([
  ['client', '../lib/api/client.ts'],
  ['./errors', '../lib/api/errors.ts'],
].map(async ([id, file]) => {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  return [id, outputText];
}));
modules.push(['@/lib/config', 'exports.USE_MOCK = false; exports.API_BASE_URL = location.origin + "/api/v1";']);
const page = '<!doctype html><script>' + [
  'const modules = new Map(' + JSON.stringify(modules) + ');',
  'const cache = new Map();',
  'function load(id) { if (!cache.has(id)) { const exports = {}; new Function("exports", "require", modules.get(id))(exports, load); cache.set(id, exports); } return cache.get(id); }',
  'const client = load("client");',
  'window.changed = false; client.onSessionChanged(() => { window.changed = true; });',
  'window.switchAccount = async () => client.withSessionCookieLock(async () => { const response = await fetch("/switch", {method: "POST"}); client.publishSessionCookieChange(); client.setAccessToken((await response.json()).accessToken); });',
  'window.startMutation = () => { window.mutation = client.apiFetch("/transactions", {method:"POST", body:"{}"}).then(() => "unexpected success", error => error.code); };',
  'window.renew = async () => { await client.ensureAccessToken(); return client.getAccessToken(); };',
].join('\n') + '</script>';

const jwt = sub => "fixture." + Buffer.from(JSON.stringify({sub})).toString("base64url") + ".signed";
let mutations = 0;
let releaseMutation;
const mutationHeld = new Promise(resolve => { releaseMutation = resolve; });
let mutationStarted;
const mutationArrived = new Promise(resolve => { mutationStarted = resolve; });
let initialCookieSent = false;
let expectedCookie = 'initial';
let concurrent = 0;
let maxConcurrent = 0;
const cookiesReceived = [];
const server = createServer(async (request, response) => {
  if (request.url === "/api/v1/transactions") {
    mutations++;
    mutationStarted();
    await mutationHeld;
    response.writeHead(401, { "Content-Type": "application/json" }).end("{}");
    return;
  }
  if (request.url === "/switch") {
    expectedCookie = "new-account";
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Set-Cookie": "fin_session=new-account; HttpOnly; SameSite=Lax; Path=/",
    }).end(JSON.stringify({accessToken:jwt("20")}));
    return;
  }
  if (request.url !== '/api/auth/refresh') {
    if (!initialCookieSent) {
      response.setHeader('Set-Cookie', 'fin_session=initial; HttpOnly; SameSite=Lax; Path=/');
      initialCookieSent = true;
    }
    response.writeHead(200, { 'Content-Type': 'text/html' }).end(page);
    return;
  }

  assert.equal(request.method, 'POST');
  const cookie = /(?:^|;\s*)fin_session=([^;]*)/.exec(request.headers.cookie || '')?.[1];
  cookiesReceived.push(cookie);
  concurrent++;
  maxConcurrent = Math.max(maxConcurrent, concurrent);
  await delay(300);
  concurrent--;
  if (cookie !== expectedCookie) {
    response.writeHead(401, { 'Content-Type': 'application/json' }).end('{}');
    return;
  }

  const rotation = expectedCookie === 'initial' ? 1 : 2;
  expectedCookie = 'rotated-' + rotation;
  response.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': 'fin_session=' + expectedCookie + '; HttpOnly; SameSite=Lax; Path=/',
  }).end(JSON.stringify({ accessToken: jwt('10') }));
});

const profile = await mkdtemp(join(tmpdir(), 'fin-session-smoke-'));
const sockets = [];
let chrome;
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' });
  const chromeExited = new Promise(resolve => {
    chrome.once('error', resolve);
    chrome.once('exit', resolve);
  });
  let debugPort;
  for (let attempt = 0; attempt < 100 && !debugPort; attempt++) {
    assert.equal(chrome.exitCode, null, 'Chrome encerrou durante a inicialização');
    const activePort = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    debugPort = activePort.split('\n')[0];
    if (!debugPort) await delay(100);
  }
  assert.ok(debugPort, 'Chrome não iniciou');

  async function openTab() {
    const target = await fetch('http://127.0.0.1:' + debugPort + '/json/new?about:blank', {
      method: 'PUT', signal: AbortSignal.timeout(5_000),
    }).then(result => result.json());
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    sockets.push(socket);
    await Promise.race([once(socket, 'open'), chromeExited.then(() => { throw Error('Chrome encerrou'); })]);
    let nextId = 0;
    const pending = new Map();
    socket.addEventListener('message', event => {
      const { id, result, error } = JSON.parse(event.data);
      const callback = pending.get(id);
      if (!callback) return;
      pending.delete(id);
      if (error) callback.reject(new Error(error.message));
      else callback.resolve(result);
    });

    async function send(method, params) {
      const id = ++nextId;
      const reply = new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
      const timer = delay(5_000, undefined, { ref: false }).then(() => { throw Error('CDP: ' + method); });
      try { return await Promise.race([reply, timer]); }
      finally { pending.delete(id); }
    }

    async function evaluate(expression) {
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression, awaitPromise: true, returnByValue: true,
      });
      if (exceptionDetails) throw Error(exceptionDetails.exception?.description || exceptionDetails.text);
      return result.value;
    }

    await send('Page.navigate', { url: origin });
    for (let attempt = 0; attempt < 30; attempt++) {
      if (await evaluate("typeof window.renew === 'function' && !!navigator.locks").catch(() => false)) return evaluate;
      await delay(100);
    }
    throw Error('Página de teste não carregou com Web Locks');
  }

  const first = await openTab();
  const second = await openTab();
  const tokens = await Promise.all([first('window.renew()'), second('window.renew()')]);
  assert.deepEqual(tokens.sort(), [jwt('10'), jwt('10')]);
  assert.deepEqual(cookiesReceived, ['initial', 'rotated-1']);
  assert.equal(maxConcurrent, 1);
  assert.equal(await first("document.cookie.includes('fin_session')"), false);
  assert.equal(await second("document.cookie.includes('fin_session')"), false);
  await first('window.startMutation()');
  await Promise.race([mutationArrived, delay(5_000, undefined, {ref: false}).then(() => { throw Error('Mutação não chegou ao servidor local'); })]);
  await second('window.switchAccount()');
  releaseMutation();
  assert.equal(await first('window.mutation'), 'SESSION_CHANGED');
  assert.equal(await first('window.changed'), true);
  assert.equal(await second('window.renew()'), jwt('20'));
  assert.equal(mutations, 1);
  assert.equal(cookiesReceived.length, 2);
  console.log('Chrome: uma mutação pendente foi descartada na troca de conta entre abas.');
  console.log('Chrome: duas abas renovaram a sessão, uma por vez, usando o cookie HttpOnly atualizado.');
} finally {
  for (const socket of sockets) socket.close();
  if (chrome?.pid && chrome.exitCode === null) {
    const exiting = once(chrome, 'exit');
    chrome.kill();
    await exiting;
  }
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
