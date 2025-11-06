import 'reflect-metadata';
import { loadEnvConfig } from './common/env';
import { bootstrap } from './bootstrap';
import { runAsWindowsService } from './windows-service';
import { selfInstallWindows } from './self-install';
import { startErpStaticServer } from './erp-static';
import { ensureElevation } from './elevate';
import { initFileLogger } from './common/logger';

async function main() {
  // Initialize file logger early to capture startup messages
  initFileLogger();
  console.log('Client Local starting...');

  // Load environment configuration
  loadEnvConfig();
  
  // Windows-specific flows
  if (process.platform === 'win32') {
    // Ensure we are elevated before attempting installation
    const relaunched = await ensureElevation();
    if (relaunched) {
      // Current (non-elevated) process should exit; elevated child will continue
      return;
    }
    // ERP static service mode
    if (process.argv.includes('--erp-service')) {
      const rootArgIndex = process.argv.indexOf('--root');
      const portArgIndex = process.argv.indexOf('--port');
      const root = rootArgIndex > -1 ? process.argv[rootArgIndex + 1] : undefined;
      const port = portArgIndex > -1 ? Number(process.argv[portArgIndex + 1]) : 8080;
      await startErpStaticServer({ root, port });
      return;
    }

    // Service wrapper mode
    if (process.argv.includes('--service')) {
      await runAsWindowsService(bootstrap);
      return;
    }

    // Self-install mode (default when not running as service)
    const installed = await selfInstallWindows().catch((err) => {
      console.error('Auto-instalação falhou:', err);
      return false;
    });
    if (installed) {
      console.log('Auto-instalação concluída. Serviços iniciados. Encerrando este processo.');
      return;
    }
    console.warn('Auto-instalação não concluída. Iniciando servidor normalmente (modo debug).');
  }

  // Non-Windows or fallback: run normally
  // Check if running as Windows service
  if (process.platform === 'win32' && process.argv.includes('--service')) {
    // Run with Windows service integration
    await runAsWindowsService(bootstrap);
  } else {
    // Run normally
    await bootstrap();
  }
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
