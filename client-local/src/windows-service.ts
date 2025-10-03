import { Logger } from '@nestjs/common';

const logger = new Logger('WindowsService');

// Import node-windows for proper SCM communication
let Service: any = null;
try {
  if (process.platform === 'win32') {
    Service = require('node-windows').Service;
  }
} catch (error) {
  logger.warn('node-windows not available:', error instanceof Error ? error.message : String(error));
}

/**
 * Windows Service Control Manager integration
 * This module handles proper communication with Windows SCM when running as a service
 */
export class WindowsServiceManager {
  private static isWindowsService = false;
  private static serviceInstance: any = null;

  /**
   * Initialize Windows service if running as service
   */
  static initialize(): void {
    // Check if we're running as a Windows service
    if (process.platform === 'win32' && process.argv.includes('--service')) {
      this.isWindowsService = true;
      logger.log('Initializing Windows Service integration...');
      
      try {
        // Setup proper Windows service integration
        this.setupServiceHandlers();
      } catch (error) {
        logger.warn('Failed to initialize Windows service integration:', error instanceof Error ? error.message : String(error));
        // Continue without service integration - fallback mode
      }
    }
  }

  /**
   * Signal to SCM that service has started successfully
   */
  static signalServiceStarted(): void {
    if (this.isWindowsService) {
      logger.log('Signaling to Windows SCM that service has started successfully');
      
      // Set process title for identification
      process.title = 'F-Flow Client Local Service';
      
      // If we have proper service integration, signal running status
      if (this.serviceInstance && typeof this.serviceInstance.setStatus === 'function') {
        try {
          this.serviceInstance.setStatus('RUNNING');
          logger.log('Service status set to RUNNING via node-windows');
        } catch (error) {
          logger.warn('Failed to set service status:', error instanceof Error ? error.message : String(error));
        }
      }
      
      // Set up proper signal handlers for Windows service
      this.setupWindowsSignalHandlers();
    }
  }

  /**
   * Signal to SCM that service is stopping
   */
  static signalServiceStopping(): void {
    if (this.isWindowsService) {
      logger.log('Signaling to Windows SCM that service is stopping');
      
      // If we have proper service integration, signal stopping status
      if (this.serviceInstance && typeof this.serviceInstance.setStatus === 'function') {
        try {
          this.serviceInstance.setStatus('STOP_PENDING');
          logger.log('Service status set to STOP_PENDING via node-windows');
        } catch (error) {
          logger.warn('Failed to set service status:', error instanceof Error ? error.message : String(error));
        }
      }
    }
  }

  /**
   * Setup Windows-specific signal handlers
   */
  private static setupWindowsSignalHandlers(): void {
    // Handle Windows service stop requests
    process.on('SIGTERM', () => {
      logger.log('Received SIGTERM - Windows service stop requested');
      this.signalServiceStopping();
    });

    // Handle Ctrl+C in console mode
    process.on('SIGINT', () => {
      logger.log('Received SIGINT - Console interrupt');
      this.signalServiceStopping();
    });

    // Windows-specific: Handle service control requests
    if (process.platform === 'win32') {
      process.on('SIGHUP', () => {
        logger.log('Received SIGHUP - Service control request');
      });
    }
  }

  /**
   * Setup service control handlers
   */
  private static setupServiceHandlers(): void {
    if (Service && process.platform === 'win32') {
      try {
        // Create a service instance for status communication
        this.serviceInstance = new Service({
          name: 'F-Flow Client Local Service',
          description: 'F-Flow Client Local Service for POS operations',
          script: process.execPath,
          scriptOptions: process.argv.slice(1)
        });

        // Set up service event handlers
        this.serviceInstance.on('start', () => {
          logger.log('Windows service start event received');
        });

        this.serviceInstance.on('stop', () => {
          logger.log('Windows service stop event received');
          process.exit(0);
        });

        logger.log('Windows service handlers configured with node-windows');
      } catch (error) {
        logger.warn('Failed to setup service handlers:', error instanceof Error ? error.message : String(error));
        this.serviceInstance = null;
      }
    } else {
      logger.log('Windows service handlers configured (fallback mode)');
    }
  }

  /**
   * Check if running as Windows service
   */
  static isRunningAsService(): boolean {
    return this.isWindowsService;
  }
}

/**
 * Simple service wrapper that ensures proper startup sequence
 */
export async function runAsWindowsService(startupFunction: () => Promise<void>): Promise<void> {
  try {
    // Initialize Windows service integration
    WindowsServiceManager.initialize();

    // Execute the main startup function
    await startupFunction();

    // Signal successful startup to SCM
    WindowsServiceManager.signalServiceStarted();

    logger.log('Windows service startup completed successfully');
  } catch (error) {
    logger.error('Windows service startup failed:', error);
    
    // Signal failure to SCM and exit
    if (WindowsServiceManager.isRunningAsService()) {
      WindowsServiceManager.signalServiceStopping();
    }
    
    process.exit(1);
  }
}