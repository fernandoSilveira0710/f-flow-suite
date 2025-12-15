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

function sendFile(res: http.ServerResponse, filePath: string, injectRuntime?: string) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';

    // Para index.html, podemos injetar configuração em tempo de execução
    if (ext === '.html' && injectRuntime) {
      try {
        let html = fs.readFileSync(filePath, 'utf-8');
        // Injeta antes do </head> ou, se não existir, no início do <body>
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${injectRuntime}</head>`);
        } else if (html.includes('<body')) {
          html = html.replace(/<body[^>]*>/i, (m) => `${m}${injectRuntime}`);
        } else {
          html = `${injectRuntime}\n${html}`;
        }
        res.writeHead(200, { 'Content-Type': type });
        res.end(html);
        return;
      } catch {}
    }

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
  const basePath = '/erp';

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

  // Evitar portas comuns (8080/8081 e próximas). Preferir faixa alta e próximos do padrão.
  const candidatePorts = [preferredPort, 18084, 18085, 18180, 28180, 38180];
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

  // Descobre porta da API local via variável de ambiente propagada pelo Electron
  const apiPort = Number(process.env.CLIENT_HTTP_PORT || '8081');
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const hubUrl = process.env.HUB_API_URL || 'https://f-flow-suite.onrender.com';
  const runtimeInject = `<script>window.__FFLOW_CONFIG__=Object.assign({}, window.__FFLOW_CONFIG__||{}, { CLIENT_LOCAL: '${apiUrl}', HUB: '${hubUrl}' });</script>`;

  const server = http.createServer((req, res) => {
    let urlPath = (req.url || '/').split('?')[0];
    // Normalize and strip base '/erp' if present, so requests like '/erp/assets/*' map to root 'assets/*'
    if (urlPath === basePath || urlPath === `${basePath}/`) {
      urlPath = '/index.html';
    } else if (urlPath.startsWith(basePath + '/')) {
      urlPath = urlPath.slice(basePath.length) || '/index.html';
    } else if (urlPath === '/') {
      // Allow root to serve index too
      urlPath = '/index.html';
    }

    const filePath = path.join(root, decodeURIComponent(urlPath));

    if (fileExists(filePath)) {
      // Injeta configuração apenas no index.html
      const inject = path.basename(filePath).toLowerCase() === 'index.html' ? runtimeInject : undefined;
      return sendFile(res, filePath, inject);
    }
    // SPA fallback for client-side routes
    return sendFile(res, indexFile, runtimeInject);
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
