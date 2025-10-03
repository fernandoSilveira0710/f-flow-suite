import { loadEnvConfig } from './common/env';
import { bootstrap } from './bootstrap';
import { runAsWindowsService } from './windows-service';

async function main() {
  // Load environment configuration
  loadEnvConfig();
  
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
