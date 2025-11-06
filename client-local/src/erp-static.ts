import http from 'http';
import net from 'net';
import fs from 'fs';
import path from 'path';

type Options = { root?: string; port?: number };

const mime: Record<string, string> = {
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

function fileExists(p: string): boolean {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function dirExists(p: string): boolean {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function sendFile(res: http.ServerResponse, filePath: string) {
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

export async function startErpStaticServer(opts: Options = {}) {
  const root = path.resolve(opts.root || path.join(process.cwd(), 'erp', 'dist'));
  const preferredPort = opts.port ?? 8080;

  if (!dirExists(root)) {
    console.error(`[ERP] Root directory does not exist: ${root}`);
    process.exit(1);
  }
  const indexFile = path.join(root, 'index.html');
  if (!fileExists(indexFile)) {
    console.error(`[ERP] index.html not found in ${root}`);
    process.exit(1);
  }

  async function isPortFree(port: number, host = '0.0.0.0'): Promise<boolean> {
    return new Promise((resolve) => {
      const tester = net
        .createServer()
        .once('error', (err: any) => {
          if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES')) {
            resolve(false);
          } else {
            resolve(false);
          }
        })
        .once('listening', () => {
          tester.close(() => resolve(true));
        })
        .listen(port, host);
    });
  }

  const candidatePorts = [preferredPort, 8088, 8090, 8082];
  let finalPort = preferredPort;
  for (const p of candidatePorts) {
    if (p === 8081) continue;
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(p);
    if (free) {
      finalPort = p;
      break;
    }
  }

  if (finalPort !== preferredPort) {
    console.warn(`[ERP] Port ${preferredPort} not available; using ${finalPort} instead.`);
  }

  const server = http.createServer((req, res) => {
    let urlPath = (req.url || '/').split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(root, decodeURIComponent(urlPath));

    if (fileExists(filePath)) {
      return sendFile(res, filePath);
    }
    return sendFile(res, indexFile);
  });

  server.listen(finalPort, '0.0.0.0', () => {
    console.log(`[ERP] Static server running at http://127.0.0.1:${finalPort}/`);
    console.log(`[ERP] Serving from ${root}`);
  });

  server.on('error', (err) => {
    console.error('[ERP] Server error:', (err as Error).message);
    process.exit(1);
  });
}