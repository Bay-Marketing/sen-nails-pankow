// Tiny static server with the same URL rules as the production configs (clean URLs, 301s, 404 page).
// Run: npm run serve   (PORT env var optional, default 4173)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
const COMPRESS = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg']);
const PRIVATE = /^\/(node_modules|tools|content|build\.mjs|serve\.mjs|package(-lock)?\.json|site\.config\.json|\.htaccess|_redirects|vercel\.json|nginx\.conf\.example)/;

const redirect = (res, to) => { res.writeHead(301, { Location: to }); res.end(); };

// Dev-only audit channel (AUDIT=1): lets a page on another origin POST its measurements into reports/audit/.
const AUDIT = process.env.AUDIT === '1';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Private-Network': 'true' };
const auditRoute = (req, res, p, url) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (p === '/__audit/snapshot.js') {
    return fs.readFile(path.join(ROOT, 'tools', 'snapshot.js'), (err, d) => {
      res.writeHead(err ? 404 : 200, { ...CORS, 'Content-Type': TYPES['.js'], 'Cache-Control': 'no-store' });
      res.end(err ? 'missing' : d);
    });
  }
  if (p === '/__audit/recv') {
    return fs.readFile(path.join(ROOT, 'tools', 'recv.html'), (err, d) => {
      res.writeHead(err ? 404 : 200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' });
      res.end(err ? 'missing' : d);
    });
  }
  if (p === '/__save' && req.method === 'POST') {
    const name = (url.searchParams.get('name') || '').replace(/[^a-z0-9._-]/gi, '');
    if (!name) { res.writeHead(400, CORS); return res.end('name'); }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const dir = path.join(ROOT, 'reports', 'audit');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${name}.json`), Buffer.concat(chunks));
      res.writeHead(204, CORS);
      res.end();
    });
    return;
  }
  res.writeHead(404, CORS);
  res.end();
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (AUDIT && (p.startsWith('/__') || req.method === 'OPTIONS')) return auditRoute(req, res, p, url);

  // legacy Wix paths and non-canonical forms -> 301 to the clean URL
  if (p === '/mysite' || p.startsWith('/mysite/')) return redirect(res, (p.slice(7) || '/') + url.search);
  if (p === '/index.html') return redirect(res, '/' + url.search);
  if (p.endsWith('.html') && !p.startsWith('/assets/') && p !== '/404.html') return redirect(res, p.slice(0, -5) + url.search);
  if (p.length > 1 && p.endsWith('/')) return redirect(res, p.slice(0, -1) + url.search);

  let file = p === '/' ? '/index.html' : p;
  let full = path.join(ROOT, file);
  if (!path.extname(file)) full += '.html';

  const send404 = () => {
    fs.readFile(path.join(ROOT, '404.html'), (err, d) => {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      res.end(err ? 'Not found' : d);
    });
  };
  if (!full.startsWith(ROOT) || PRIVATE.test(p) || p === '/404.html') return send404();

  fs.readFile(full, (err, data) => {
    if (err || fs.statSync(full).isDirectory()) return send404();
    const ext = path.extname(full);
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream' };
    headers['Cache-Control'] = full.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
    if (COMPRESS.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip';
      headers.Vary = 'Accept-Encoding';
      data = zlib.gzipSync(data);
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
