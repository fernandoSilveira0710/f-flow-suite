import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger, StructuredLogger } from './common/logger';
import { loadEnvConfig } from './common/env';
import { PrismaClient } from '@prisma/client';
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
    
    // Run migrations
    await runMigrations();
    
    // Initialize application logger
    logger.log('Initializing application logger...');
    const appLogger = createLogger(logDir);
    logger.log('Application logger initialized successfully');
    
    // Create NestJS application
    logger.log('Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    
    // Configure structured logger for NestJS
  app.useLogger(new StructuredLogger(logDir));
    logger.log('Structured logger configured successfully');
    
    // Start server
    const port = process.env.PORT ? Number(process.env.PORT) : 3010;
    const host = '127.0.0.1';
    
    await app.listen(port, host);
    logger.log(`F-Flow Client Local server started on http://${host}:${port}`);
    
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
    logger.error('Failed to start F-Flow Client Local server', error);
    process.exit(1);
  }
}

export function getBootstrapConfig(): BootstrapConfig {
  const { dataDir, logDir } = resolvePaths();
  const databaseUrl = setupDatabase(dataDir);
  const port = process.env.PORT ? Number(process.env.PORT) : 3010;
  const host = '127.0.0.1';
  
  return {
    dataDir,
    logDir,
    databaseUrl,
    port,
    host,
  };
}