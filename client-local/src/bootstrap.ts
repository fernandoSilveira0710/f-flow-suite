import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger, StructuredLogger } from './common/logger';
import { loadEnvConfig } from './common/env';
import { spawn } from 'child_process';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, platform } from 'os';

export interface BootstrapConfig {
  dataDir: string;
  logDir: string;
  databaseUrl: string;
  port: number;
  host: string;
}

function resolvePaths(): { dataDir: string; logDir: string } {
  const isWindows = platform() === 'win32';
  const home = homedir();
  
  if (isWindows) {
    const localAppData = process.env.LOCALAPPDATA || join(home, 'AppData', 'Local');
    const baseDir = join(localAppData, 'F-Flow Suite');
    return {
      dataDir: join(baseDir, 'data'),
      logDir: join(baseDir, 'logs'),
    };
  } else {
    const baseDir = join(home, '.f-flow-suite');
    return {
      dataDir: join(baseDir, 'data'),
      logDir: join(baseDir, 'logs'),
    };
  }
}

function ensureDirectories(dataDir: string, logDir: string): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
}

function setupDatabase(dataDir: string): string {
  const dbPath = join(dataDir, 'local.db');
  const databaseUrl = `file:${dbPath}`;
  
  // Set the DATABASE_URL environment variable for Prisma
  process.env.DATABASE_URL = databaseUrl;
  
  // Copy seed database if running as binary and database doesn't exist
  if ((process as any).pkg && !existsSync(dbPath)) {
    const seedDbPath = join(dirname(process.execPath), 'seed.db');
    if (existsSync(seedDbPath)) {
      copyFileSync(seedDbPath, dbPath);
    }
  }
  
  return databaseUrl;
}

async function runMigrations(): Promise<void> {
  const logger = new Logger('Bootstrap');
  
  logger.log('Running Prisma migrations...');
  
  return new Promise((resolve, reject) => {
    // Generate Prisma client first
    const generateProcess = spawn('npx', ['prisma', 'generate'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    generateProcess.on('close', (code) => {
      if (code === 0) {
        logger.log('Prisma client generated successfully');
        
        // Run migrations
        const migrateProcess = spawn('npx', ['prisma', 'migrate', 'deploy'], {
          stdio: 'pipe',
          shell: true,
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
        });
        
        migrateProcess.on('close', (migrateCode) => {
          if (migrateCode === 0) {
            logger.log('Database migrations completed successfully');
            resolve();
          } else {
            reject(new Error(`Migration failed with code ${migrateCode}`));
          }
        });
        
        migrateProcess.on('error', (error) => {
          reject(error);
        });
      } else {
        reject(new Error(`Prisma generate failed with code ${code}`));
      }
    });
    
    generateProcess.on('error', (error) => {
      reject(error);
    });
  });
}

function setupPrismaEngineIfPackaged(): void {
  try {
    if ((process as any).pkg) {
      const exeDir = dirname(process.execPath);
      const candidates = [
        'libquery_engine-windows.dll.node',
        'query_engine-windows.dll.node',
      ];
      for (const name of candidates) {
        const fullPath = join(exeDir, name);
        if (existsSync(fullPath)) {
          process.env.PRISMA_QUERY_ENGINE_LIBRARY = fullPath;
          process.env.PRISMA_QUERY_ENGINE_BINARY = fullPath;
          break;
        }
      }
    }
  } catch {
    // silent
  }
}

export async function bootstrap(): Promise<void> {
  try {
    const logger = new Logger('Bootstrap');
    
    // Check if LOCAL_SERVER_ENABLED is false
    if (process.env.LOCAL_SERVER_ENABLED === 'false') {
      logger.log('Local server is disabled. Exiting...');
      return;
    }
    
    // Resolve and ensure directories
    const { dataDir, logDir } = resolvePaths();
    logger.log(`Data directory: ${dataDir}`);
    logger.log(`Log directory: ${logDir}`);
    ensureDirectories(dataDir, logDir);

    // Setup database
    const databaseUrl = setupDatabase(dataDir);
    logger.log(`Database URL: ${databaseUrl}`);

    // Ensure Prisma engine path when running as packaged binary
    setupPrismaEngineIfPackaged();

    // Run migrations (can be skipped via env)
    if ((process as any).pkg) {
      logger.log('Skipping Prisma migrations in packaged binary');
    } else if (process.env.SKIP_MIGRATIONS !== 'true') {
      await runMigrations();
    } else {
      logger.log('Skipping Prisma migrations due to SKIP_MIGRATIONS=true');
    }
    
    // Initialize application logger
    logger.log('Initializing application logger...');
    const appLogger = createLogger(logDir);
    logger.log('Application logger initialized successfully');
    
    // Create NestJS application
    logger.log('Creating NestJS application...');
    try {
      const dbgDir = (process.env.ProgramData || 'C://ProgramData') + '//FFlow//logs//client-local';
      try { require('fs').mkdirSync(dbgDir, { recursive: true }); } catch {}
      require('fs').appendFileSync(dbgDir + '//startup-debug.log', `[${new Date().toISOString()}] before NestFactory.create\n`);
    } catch {}
    let app;
    try {
      app = await NestFactory.create(AppModule, {
        bufferLogs: true,
      });
      try {
        const dbgDir = (process.env.ProgramData || 'C://ProgramData') + '//FFlow//logs//client-local';
        require('fs').appendFileSync(dbgDir + '//startup-debug.log', `[${new Date().toISOString()}] after NestFactory.create\n`);
      } catch {}
    } catch (e) {
      try {
        const dbgDir = (process.env.ProgramData || 'C://ProgramData') + '//FFlow//logs//client-local';
        require('fs').appendFileSync(dbgDir + '//startup-debug.log', `[${new Date().toISOString()}] NestFactory.create error: ${e instanceof Error ? e.stack || e.message : String(e)}\n`);
      } catch {}
      throw e;
    }
    
    // Configure structured logger for NestJS
    try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] before useLogger\n`); } catch {}
    app.useLogger(new StructuredLogger(logDir));
    try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] after useLogger\n`); } catch {}
    logger.log('Structured logger configured successfully');
    
    // Configure CORS
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:8080',
      process.env.SITE_URL || 'http://localhost:5173',
      // Incluir variações com 127.0.0.1 para compatibilidade
      (process.env.FRONTEND_URL || 'http://localhost:8080').replace('localhost', '127.0.0.1'),
      (process.env.SITE_URL || 'http://localhost:5173').replace('localhost', '127.0.0.1'),
    ];

    // Permite qualquer porta de localhost/127.0.0.1 em desenvolvimento
    const isDevLocalOrigin = (origin: string): boolean => {
      try {
        const url = new URL(origin);
        return (
          (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
          (url.protocol === 'http:' || url.protocol === 'https:')
        );
      } catch {
        return false;
      }
    };

    try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] before enableCors\n`); } catch {}
    app.enableCors({
      origin: (origin, callback) => {
        // Allow non-browser requests (e.g., curl, server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || isDevLocalOrigin(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept',
        'Origin',
        'X-Requested-With',
        'Cache-Control',
        'Pragma',
        'Expires',
        'x-tenant-id'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      preflightContinue: false,
    });
    try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] after enableCors\n`); } catch {}
    logger.log('CORS configured successfully');
    
    // Verificação de licença na inicialização
    try {
      try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] before license check\n`); } catch {}
      logger.log('Checking license status on startup...');
      const { StartupLicenseGuard } = await import('./licensing/startup-license.guard');
      const startupGuard = app.get(StartupLicenseGuard);
      
      // Atualiza cache de licença se possível
      await startupGuard.updateCacheOnStartup();
      
      // Verifica status da licença
      const licenseCheck = await startupGuard.checkStartupLicense();
      
      try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] after license check\n`); } catch {}
      if (!licenseCheck.canStart) {
        logger.error(`License check failed: ${licenseCheck.message}`);
        logger.error('Application cannot start due to license restrictions');
        process.exit(1);
      }
      
      if (licenseCheck.showWarning) {
        logger.warn(`License Warning: ${licenseCheck.message}`);
      } else if (licenseCheck.requiresSetup) {
        logger.warn(`License Setup Required: ${licenseCheck.message}`);
      } else {
        logger.log(`License Status: ${licenseCheck.message}`);
      }
      
    } catch (error) {
      logger.warn('License check failed during startup:', error instanceof Error ? error.message : String(error));
      logger.warn('Continuing startup with limited functionality');
    }
    
    // Start server
    try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] before listen\n`); } catch {}
    const port = process.env.CLIENT_HTTP_PORT
      ? Number(process.env.CLIENT_HTTP_PORT)
      : (process.env.PORT ? Number(process.env.PORT) : 8081);
    
    // Listen on default interface to support localhost via IPv4/IPv6
    await app.listen(port);
    try { require('fs').appendFileSync(((process.env.ProgramData||'C://ProgramData')+'//FFlow//logs//client-local//startup-debug.log'), `[${new Date().toISOString()}] after listen\n`); } catch {}
    logger.log(`F-Flow Client Local server started on port ${port}`);
    
    // Graceful shutdown handlers
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });
    
  } catch (error) {
    const logger = new Logger('Bootstrap');
    try {
      const localAppData = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
      const logDir = join(localAppData, 'F-Flow Suite', 'logs');
      try { mkdirSync(logDir, { recursive: true }); } catch {}
      const logFile = join(logDir, 'bootstrap-error.log');
      const payload = `\n[${new Date().toISOString()}] Startup error: ${error instanceof Error ? error.stack || error.message : String(error)}\n`;
      require('fs').appendFileSync(logFile, payload);
    } catch {}
    logger.error('Failed to start F-Flow Client Local server', error);
    process.exit(1);
  }
}

export function getBootstrapConfig(): BootstrapConfig {
  const { dataDir, logDir } = resolvePaths();
  const databaseUrl = setupDatabase(dataDir);
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const host = '127.0.0.1';
  
  return {
    dataDir,
    logDir,
    databaseUrl,
    port,
    host,
  };
}