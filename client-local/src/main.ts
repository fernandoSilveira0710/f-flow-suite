import { loadEnvConfig } from './common/env';
import { bootstrap } from './bootstrap';

// Load environment configuration first
loadEnvConfig();

// Start the application using the new bootstrap system
bootstrap();
