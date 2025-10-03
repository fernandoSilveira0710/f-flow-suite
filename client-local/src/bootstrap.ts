import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger, StructuredLogger } from './common/logger';

const execAsync = promisify(exec);

export interface BootstrapConfig {
  dataDir: string;
  logDir: string;
  databaseUrl: string;
  port: number;
  isService: boolean;
}

/**
 * Resolve paths based on operating system
 */
export function resolvePaths(): { dataDir: string; logDir: string } {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  let dataDir: string;
  let logDir: string;

  switch (platform) {
    case 'win32':
      // Windows: %LOCALAPPDATA%/F-Flow Suite/
      const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
      dataDir = path.join(localAppData, 'F-Flow Suite', 'data');
      logDir = path.join(localAppData, 'F-Flow Suite', 'logs');
      break;
    
    case 'darwin':
      // macOS: ~/Library/Application Support/F-Flow Suite/
      dataDir = path.join(homeDir, 'Library', 'Application Support', 'F-Flow Suite', 'data');
      logDir = path.join(homeDir, 'Library', 'Application Support', 'F-Flow Suite', 'logs');
      break;
    
    default:
      // Linux: ~/.local/share/f-flow-suite/
      dataDir = path.join(homeDir, '.local', 'share', 'f-flow-suite', 'data');
      logDir = path.join(homeDir, '.local', 'share', 'f-flow-suite', 'logs');
      break;
  }

  // Allow override via environment variables
  if (process.env.LOCAL_DATA_DIR) {
    dataDir = process.env.LOCAL_DATA_DIR;
  }
  
  if (process.env.LOCAL_LOG_DIR) {
    logDir = process.env.LOCAL_LOG_DIR;
  }

  return { dataDir, logDir };
}

/**
 * Ensure directories exist
 */
export function ensureDirectories(dataDir: string, logDir: string): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Setup database URL
 */
export function setupDatabase(dataDir: string): string {
  const logger = new Logger('Bootstrap');
  const dbPath = path.join(dataDir, 'local.db');
  
  // Se estiver rodando em binário (pkg) e o banco não existir, copiar do semente
  if ((process as any).pkg && !fs.existsSync(dbPath)) {
    const seedDbPath = path.join(__dirname, '..', 'prisma', 'local.db');
    if (fs.existsSync(seedDbPath)) {
      fs.copySync(seedDbPath, dbPath);
      logger.log('Copied seed database to data directory');
    }
  }
  
  return `file:${dbPath}`;
}

/**
 * Run Prisma migrations
 */
export async function runMigrations(databaseUrl: string): Promise<void> {
  const logger = new Logger('Bootstrap');
  
  // Se estiver rodando em binário (pkg), não execute migrations
  if ((process as any).pkg) {
    logger.warn('Running in packaged mode; skipping Prisma migrations');
    return;
  }
  
  try {
    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = databaseUrl;
    
    logger.log('Running Prisma migrations...');
    
    // Generate Prisma client
    await execAsync('npx prisma generate');
    logger.log('Prisma client generated successfully');
    
    // Run migrations
    await execAsync('npx prisma migrate deploy');
    logger.log('Database migrations completed successfully');
    
  } catch (error) {
    logger.error('Failed to run migrations:', error);
    throw error;
  }
}

/**
 * Bootstrap the application
 */
export async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  
  try {
    // Check if LOCAL_SERVER_ENABLED is set to false
    if (process.env.LOCAL_SERVER_ENABLED === 'false') {
      logger.warn('LOCAL_SERVER_ENABLED is set to false. Server will not start.');
      process.exit(0);
    }

    // Resolve paths
    const { dataDir, logDir } = resolvePaths();
    logger.log(`Data directory: ${dataDir}`);
    logger.log(`Log directory: ${logDir}`);

    // Ensure directories exist
    ensureDirectories(dataDir, logDir);

    // Setup database
    const databaseUrl = setupDatabase(dataDir);
    logger.log(`Database URL: ${databaseUrl}`);

    // Run migrations
    await runMigrations(databaseUrl);

    // Initialize logger
    const appLogger = createLogger(logDir);
    
    // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, we'll use our custom one
  });
  
  // Use our custom logger
  app.useLogger(new StructuredLogger(logDir, 'NestApplication'));

    // Get port from environment or default to 3010
    const port = parseInt(process.env.PORT || '3010', 10);

    // Check if running as service
    const isService = process.argv.includes('--service');
    
    if (isService) {
      logger.log('Starting in service mode...');
    }

    // Start the server
    await app.listen(port, '127.0.0.1');
    logger.log(`F-Flow Client Local server started on http://127.0.0.1:${port}`);

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('Received SIGTERM, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('Received SIGINT, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
}

/**
 * Get bootstrap configuration
 */
export function getBootstrapConfig(): BootstrapConfig {
  const { dataDir, logDir } = resolvePaths();
  const databaseUrl = setupDatabase(dataDir);
  const port = parseInt(process.env.PORT || '3010', 10);
  const isService = process.argv.includes('--service');

  return {
    dataDir,
    logDir,
    databaseUrl,
    port,
    isService,
  };
}