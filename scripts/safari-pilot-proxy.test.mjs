import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createPilotProxy } from './safari-pilot-proxy.mjs';

async function listen(server) { server.listen(0, '127.0.0.1'); await once(server, 'listening'); return `http://127.0.0.1:${server.address().port}`; }
const origin = 'https://fin-pilot.example.test';
async function fixture(run) {
  const received = [];
  const upstream = http.createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    received.push({ url: req.url, method: req.method, headers: req.headers, body: Buffer.concat(chunks) });
    if (req.url === '/login?redirect') { res.writeHead(307, { Location: '/dashboard' }); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'fixture=value; HttpOnly; Secure; SameSite=Lax', 'Retry-After': '30' });
    res.end('{"ok":true}');
  });
  const destination = await listen(upstream);
  const proxy = createPilotProxy({ publicOrigin: origin, frontend: destination, backend: destination });
  const local = await listen(proxy);
  const call = (path, method='GET', headers={}, body) => new Promise((resolve, reject) => {
    const req = http.request(local + path, { method, headers: { Host: new URL(origin).host, ...headers } }, async res => {
      const chunks=[]; for await (const chunk of res) chunks.push(chunk);
      resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() });
    }); req.on('error', reject); req.end(body);
  });
  try { await run({ call, received, destination }); }
  finally { proxy.closeAllConnections(); upstream.closeAllConnections(); await Promise.all([new Promise(r => proxy.close(r)), new Promise(r => upstream.close(r))]); }
}

test('nega caminhos internos, Swagger, outros métodos e tentativas de proxy aberto', async () => fixture(async ({ call, received }) => {
  for (const path of ['/.env', '/.env.local', '/pom.xml', '/v3/api-docs', '/swagger-ui.html', '/_next/static/private.map', '/api/auth/other', '/api/v1/admin', '//example.com/']) {
    assert.ok([400,404].includes((await call(path)).status), path);
  }
  for (const path of ['/api/v1/users/me', '/api/v1/transactions/1', '/api/v1/credit-cards/1/invoices/2026-11/payments']) {
    assert.equal((await call(path, 'DELETE', { Origin: origin })).status, 404);
  }
  assert.equal((await call('/api/v1/accounts', 'POST', { Origin: origin })).status, 404);
  assert.equal(received.length, 0);
}));

test('valida Host e Origin antes do encaminhamento e exige Origin na sessão', async () => fixture(async ({ call, received }) => {
  assert.equal((await call('/login', 'GET', { Host: 'other.example.test' })).status, 403);
  assert.equal((await call('/api/auth/session', 'POST', { Origin: 'https://other.example.test' })).status, 403);
  assert.equal((await call('/api/auth/refresh', 'POST')).status, 403);
  assert.equal(received.length, 0);
}));

test('preserva bytes/MIME/JWT/chave da IA, não encaminha cookies à API nem confia em headers do proxy externo', async () => fixture(async ({ call, received, destination }) => {
  const audio = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 255, 7]);
  const result = await call('/api/v1/ai/transaction-drafts', 'POST', { Origin: origin, Authorization: 'Bearer synthetic-fixture', 'Content-Type': 'audio/webm', 'Idempotency-Key': 'fixture-intent', Cookie: 'fixture=private', 'X-Forwarded-Host': 'evil.example.test' }, audio);
  assert.equal(result.status, 200); assert.equal(result.headers['retry-after'], '30');
  assert.equal(result.headers['cache-control'], 'no-store');
  const request = received[0]; assert.deepEqual(request.body, audio);
  assert.equal(request.headers.authorization, 'Bearer synthetic-fixture');
  assert.equal(request.headers['idempotency-key'], 'fixture-intent');
  assert.equal(request.headers['content-type'], 'audio/webm');
  assert.equal(request.headers.cookie, undefined); assert.equal(request.headers.origin, undefined);
  assert.equal(request.headers['x-forwarded-host'], new URL(destination).host);
}));

test('mantém cookie de sessão e transforma apenas a origem externa já validada', async () => fixture(async ({ call, received, destination }) => {
  const response = await call('/api/auth/session', 'POST', { Origin: origin, 'Content-Type': 'application/json', Cookie: 'fixture=current' }, '{}');
  assert.equal(response.status, 200); assert.match(response.headers['set-cookie'][0], /HttpOnly; Secure/);
  assert.equal(received[0].headers.origin, destination.replace('127.0.0.1', 'localhost')); assert.equal(received[0].headers.cookie, 'fixture=current');
  const redirect = await call('/login?redirect'); assert.equal(redirect.status, 307); assert.equal(redirect.headers.location, origin + '/dashboard');
}));

test('recusa corpo acima do limite antes de atingir a API', async () => fixture(async ({ call, received }) => {
  assert.equal((await call('/api/v1/ai/transaction-drafts', 'POST', { Origin: origin }, Buffer.alloc(2 * 1024 * 1024 + 1))).status, 413);
  assert.equal(received.length, 0);
}));

test('configuração rejeita destino remoto e origem sem HTTPS', () => {
  assert.throws(() => createPilotProxy({ publicOrigin: 'http://example.test' }));
  assert.throws(() => createPilotProxy({ publicOrigin: origin, backend: 'http://example.test' }));
});
test('encaminha chunks do Next com grupos de rota e mantém bloqueio de sourcemaps codificados', async () => fixture(async ({ call }) => {
  assert.equal((await call('/_next/static/chunks/app/(public)/login/page-123.js')).status, 200);
  assert.equal((await call('/_next/static/chunks/app/%28app%29/cards/%5Bid%5D/page-123.js')).status, 200);
  assert.equal((await call('/_next/static/private.m%61p')).status, 404);
}));
