import pino from 'pino';
import * as path from 'path';
import { createStream } from 'rotating-file-stream';
import fs from 'fs';

export interface LoggerConfig {
  logDir: string;
  level?: string;
  enableConsole?: boolean;
}

/**
 * Create a structured logger with rotation
 */
export function createLogger(logDir: string, config?: Partial<LoggerConfig>) {
  const logLevel = config?.level || process.env.LOG_LEVEL || 'info';
  const enableConsole = config?.enableConsole ?? (process.env.NODE_ENV !== 'production');

  // Create rotating file stream
  const fileStream = createStream('f-flow-client.log', {
    interval: '1d', // rotate daily
    path: logDir,
    maxFiles: 30, // keep 30 days of logs
    compress: 'gzip', // compress old logs
  });

  // Create streams array
  const streams: pino.StreamEntry[] = [
    {
      level: logLevel as pino.Level,
      stream: fileStream,
    },
  ];

  // Add console stream if enabled
  if (enableConsole) {
    streams.push({
      level: logLevel as pino.Level,
      stream: pino.destination(1), // stdout
    });
  }

  // Create logger with structured format
  const logger = pino(
    {
      level: logLevel,
      formatters: {
        level: (label: string) => {
          return { level: label };
        },
        bindings: (bindings: any) => {
          return {
            pid: bindings.pid,
            hostname: bindings.hostname,
            service: 'f-flow-client-local',
          };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: 'f-flow-client-local',
      },
    },
    pino.multistream(streams)
  );

  return logger;
}

/**
 * Create a NestJS compatible logger
 */
export class StructuredLogger {
  private logger: pino.Logger;

  constructor(logDir: string, context?: string) {
    this.logger = createLogger(logDir);
    if (context) {
      this.logger = this.logger.child({ context });
    }
  }

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }

  setContext(context: string) {
    this.logger = this.logger.child({ context });
  }
}

/**
 * Create request logger middleware
 */
export function createRequestLogger(logDir: string) {
  const logger = createLogger(logDir);

  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Add request ID to request object
    req.requestId = requestId;

    // Log request
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      type: 'request',
    }, `${req.method} ${req.url}`);

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - start;
      
      logger.info({
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        type: 'response',
      }, `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);

      originalEnd.apply(this, args);
    };

    next();
  };
}

export function initFileLogger() {
  try {
    const programData = process.env.ProgramData || 'C:\\ProgramData';
    const defaultDir = path.join(programData, 'FFlow', 'logs', 'client-local');
    const logDir = process.env.LOCAL_LOG_DIR || defaultDir;

    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'client-local.log');
    const stream = fs.createWriteStream(logFile, { flags: 'a' });
    // Write initial line to confirm logger initialization
    stream.write(`[${new Date().toISOString()}] INFO File logger initialized at ${logFile}\n`);

    const format = (level: string, args: any[]) => {
      const msg = args
        .map((a) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()))
        .join(' ');
      return `[${new Date().toISOString()}] ${level} ${msg}\n`;
    };

    const origLog = console.log;
    const origError = console.error;
    const origWarn = console.warn;

    console.log = (...args: any[]) => {
      stream.write(format('INFO', args));
      origLog(...args);
    };
    console.error = (...args: any[]) => {
      stream.write(format('ERROR', args));
      origError(...args);
    };
    console.warn = (...args: any[]) => {
      stream.write(format('WARN', args));
      origWarn(...args);
    };

    process.on('uncaughtException', (err: any) => {
      stream.write(format('UNCAUGHT', [err?.stack || err?.message || String(err)]));
    });
    process.on('unhandledRejection', (reason: any) => {
      stream.write(format('REJECTION', [String(reason)]));
    });
  } catch (e) {
    // Swallow logging init errors to avoid breaking the app
  }
}