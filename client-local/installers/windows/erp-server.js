#!/usr/bin/env node
// Minimal static file server for ERP build (SPA) without external deps
// Usage: node erp-server.js --root <path-to-dist> --port <port>

const http = require('http');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { root: process.cwd(), port: 8080 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--root') opts.root = args[++i];
    else if (a === '--port') opts.port = Number(args[++i]);
  }
  return opts;
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.map': 'application/json',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': type });
    stream.pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function start() {
  const { root, port } = parseArgs();
  const resolvedRoot = path.resolve(root);
  if (!dirExists(resolvedRoot)) {
    console.error(`[ERP] Root directory does not exist: ${resolvedRoot}`);
    process.exit(1);
  }
  const indexFile = path.join(resolvedRoot, 'index.html');
  if (!fileExists(indexFile)) {
    console.error(`[ERP] index.html not found in ${resolvedRoot}`);
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    // Normalize URL
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(resolvedRoot, decodeURIComponent(urlPath));

    if (fileExists(filePath)) {
      return sendFile(res, filePath);
    }
    // SPA fallback
    return sendFile(res, indexFile);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[ERP] Static server running at http://127.0.0.1:${port}/`);
    console.log(`[ERP] Serving from ${resolvedRoot}`);
  });

  server.on('error', (err) => {
    console.error('[ERP] Server error:', err.message);
    process.exit(1);
  });
}

start();