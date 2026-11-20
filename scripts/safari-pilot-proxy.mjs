// Ferramenta temporária de desenvolvimento. Não faz parte do servidor de produção.
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const READ_API = /^\/api\/v1\/(?:users\/me|accounts(?:\/\d+)?|categories|credit-cards(?:\/\d+\/invoices)?|transactions(?:\/\d+)?|dashboard\/(?:summary|expenses-by-category|evolution|recent-transactions)|goals)$/;
const WRITE_API = /^\/api\/v1\/(?:auth\/(?:google|refresh|logout)|ai\/transaction-drafts|transactions)$/;
const SESSION = /^\/api\/auth\/(?:session|refresh|logout)$/;
const PAGE = /^\/(?:login|dashboard|transactions(?:\/new)?)?\/?$/;
const HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

export function createPilotProxy({ publicOrigin, frontend = 'http://127.0.0.1:3007', backend = 'http://127.0.0.1:8080' }) {
  const external = new URL(publicOrigin);
  if (external.protocol !== 'https:' || external.origin !== publicOrigin) throw new Error('Informe somente a origem HTTPS do piloto.');
  const front = new URL(frontend), back = new URL(backend);
  for (const target of [front, back]) {
    if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1' || target.username || target.password) {
      throw new Error('Destinos precisam ser HTTP em 127.0.0.1.');
    }
  }
  // Next start constrói request.nextUrl com localhost, mesmo ouvindo em 127.0.0.1.
  const nextOrigin = new URL(front); nextOrigin.hostname = 'localhost';
  return http.createServer((req, res) => {
    const reject = (status, detail) => {
      if (res.writableEnded || res.destroyed) return;
      if (res.headersSent) { res.destroy(); return; }
      res.writeHead(status, { 'Content-Type': 'application/problem+json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify({ status, title: 'Acesso ao piloto', detail }));
    };
    let url, decoded;
    try {
      if (!req.url?.startsWith('/') || req.url.startsWith('//')) throw new Error();
      url = new URL(req.url, external);
      decoded = decodeURIComponent(req.url.split('?')[0]);
      if (decoded.includes('\\') || decoded.split('/').some(part => part === '.' || part === '..') || /[\u0000-\u001f]/.test(decoded)) throw new Error();
    } catch { reject(400, 'Caminho inválido.'); return; }
    if (req.headers.host !== external.host) { reject(403, 'Host não autorizado.'); return; }
    const origin = req.headers.origin;
    if (origin && origin !== external.origin) { reject(403, 'Origem não autorizada.'); return; }
    const method = req.method;
    const read = method === 'GET' || method === 'HEAD';
    const api = url.pathname.startsWith('/api/v1/');
    const session = SESSION.test(url.pathname);
    const staticAsset = decoded.startsWith('/_next/static/') && decoded.split('/').slice(3).every(part => /^[a-zA-Z0-9_.@()\[\]-]+$/.test(part)) && !decoded.endsWith('.map');
    const icon = /^\/(?:favicon\.ico|icon(?:-light-32x32|-dark-32x32)?\.png|apple-icon\.png|icon\.svg)$/.test(url.pathname);
    const allowed = api ? (read ? READ_API.test(url.pathname) : method === 'POST' && WRITE_API.test(url.pathname))
      : session ? (method === 'POST' || (read && url.pathname === '/api/auth/session'))
      : read && (PAGE.test(url.pathname) || staticAsset || icon);
    if (!allowed) { reject(404, 'Este caminho não está disponível no piloto.'); return; }
    if (session && method === 'POST' && origin !== external.origin) { reject(403, 'Origem obrigatória para a sessão.'); return; }
    const limit = url.pathname === '/api/v1/ai/transaction-drafts' ? 2 * 1024 * 1024 : 64 * 1024;
    if (Number(req.headers['content-length'] || 0) > limit) { reject(413, 'Corpo acima do limite do piloto.'); return; }
    const target = api ? back : front;
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && !HOP.has(key) && !key.startsWith('x-forwarded-') && !key.startsWith('cf-') &&
          !['host', 'origin', 'forwarded', 'accept-encoding', 'x-real-ip'].includes(key) && !(api && key === 'cookie')) headers[key] = value;
    }
    // A origem externa já foi verificada; os servidores locais recebem sua própria origem.
    headers.host = target.host;
    headers['x-forwarded-host'] = target.host;
    headers['x-forwarded-proto'] = 'http';
    headers['x-forwarded-port'] = target.port;
    if (origin && !api) headers.origin = nextOrigin.origin;
    const upstream = http.request(new URL(url.pathname + url.search, target), { method, headers }, response => {
      const responseHeaders = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (value !== undefined && !HOP.has(key) && !['access-control-allow-origin', 'access-control-allow-credentials'].includes(key)) responseHeaders[key] = value;
      }
      if (responseHeaders.location) {
        const redirect = new URL(responseHeaders.location, target);
        if ([front.origin, nextOrigin.origin, back.origin].includes(redirect.origin)) responseHeaders.location = external.origin + redirect.pathname + redirect.search;
      }
      responseHeaders['cache-control'] = 'no-store';
      responseHeaders['x-content-type-options'] = 'nosniff';
      res.writeHead(response.statusCode || 502, responseHeaders);
      response.pipe(res);
    });
    upstream.setTimeout(65_000, () => upstream.destroy());
    upstream.on('error', () => reject(502, 'O serviço local não está disponível.'));
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { req.unpipe(upstream); reject(413, 'Corpo acima do limite do piloto.'); upstream.destroy(); }
    });
    req.on('aborted', () => upstream.destroy());
    res.on('close', () => { if (!res.writableFinished) upstream.destroy(); });
    req.pipe(upstream);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const publicOrigin = process.env.FIN_SAFARI_ORIGIN;
  if (!publicOrigin) throw new Error('Defina FIN_SAFARI_ORIGIN com o endereço HTTPS temporário aprovado.');
  const server = createPilotProxy({ publicOrigin });
  server.listen(8766, '127.0.0.1', () => console.log('Proxy restrito do piloto em 127.0.0.1:8766; frontend 3007 e API 8080.'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}