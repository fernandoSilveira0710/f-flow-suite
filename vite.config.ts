import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: true,
    proxy: {
      '/licensing': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Definir headers necessários para CORS
            proxyReq.setHeader('Host', 'localhost:8081');
            console.log('Proxy request:', req.method, req.url, '-> http://localhost:8081' + req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Garantir que os headers CORS estejam presentes na resposta
            proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': 'http://localhost:8080',
              'Access-Control-Allow-Credentials': 'true'
            });
            res.end('Proxy error: ' + err.message);
          });
        }
      }
    }
  },
})
