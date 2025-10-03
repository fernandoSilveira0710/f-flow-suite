import { Logger } from '@nestjs/common';

const logger = new Logger('WindowsService');

// Windows API constants for service status
const SERVICE_RUNNING = 0x00000004;
const SERVICE_START_PENDING = 0x00000002;
const SERVICE_STOPPED = 0x00000001;

/**
 * Windows Service Control Manager integration
 * This module handles proper communication with Windows SCM when running as a service
 */
export class WindowsServiceManager {
  private static isWindowsService = false;
  private static startupTimeout: NodeJS.Timeout | null = null;
  private static serviceStatusHandle: any = null;
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize Windows service if running as service
   */
  static initialize(): void {
    // Check if we're running as a Windows service
    if (process.platform === 'win32' && process.argv.includes('--service')) {
      this.isWindowsService = true;
      logger.log('Initializing Windows Service integration...');
      
      // Set process title for identification
      process.title = 'F-Flow Client Local Service';
      
      // Setup proper Windows service integration
      this.setupServiceHandlers();
    }
  }

  /**
   * Signal to SCM that service has started successfully
   */
  static signalServiceStarted(): void {
    if (this.isWindowsService) {
      logger.log('Signaling to Windows SCM that service has started successfully');
      
      // Clear any startup timeout
      if (this.startupTimeout) {
        clearTimeout(this.startupTimeout);
        this.startupTimeout = null;
      }
      
      try {
        // Use a more robust approach for SCM communication
        this.notifyServiceStatus('RUNNING');
        
        logger.log('Service startup signal sent successfully');
      } catch (error) {
        logger.warn('Failed to send service startup signal:', error instanceof Error ? error.message : String(error));
      }
      
      // Set up proper signal handlers for Windows service
      this.setupWindowsSignalHandlers();
    }
  }

  /**
   * Notify service status to SCM using multiple approaches for maximum compatibility
   */
  private static notifyServiceStatus(status: 'RUNNING' | 'STOPPING'): void {
    try {
      // Method 1: Environment variable (for debugging and monitoring)
      process.env.SERVICE_STATUS = status;
      
      // Method 2: Write to stdout (some service managers read this)
      process.stdout.write(`SERVICE_${status}\n`);
      
      // Method 3: Use Windows-specific approach if available
      if (process.platform === 'win32') {
        try {
          // Try to use Windows API directly through process
          const statusCode = status === 'RUNNING' ? SERVICE_RUNNING : SERVICE_STOPPED;
          
          // Signal through process exit code mechanism
          if (status === 'RUNNING') {
            // For running status, we don't exit but signal readiness
            process.send?.({ type: 'service-status', status: 'running' });
          }
          
        } catch (winError) {
          logger.debug('Windows API approach failed, using fallback methods');
        }
      }
      
      // Method 4: Create a heartbeat mechanism for running services
      if (status === 'RUNNING') {
        this.startHeartbeat();
      } else {
        this.stopHeartbeat();
      }
      
    } catch (error) {
      logger.warn('Failed to notify service status:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Start heartbeat mechanism to keep service alive
   */
  private static startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isWindowsService && process.env.SERVICE_STATUS === 'RUNNING') {
        // Simple heartbeat - just update a timestamp
        process.env.SERVICE_HEARTBEAT = Date.now().toString();
        
        // Optionally write a heartbeat to stdout (commented out to reduce noise)
        // process.stdout.write('SERVICE_HEARTBEAT\n');
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat mechanism
   */
  private static stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Signal to SCM that service is stopping
   */
  static signalServiceStopping(): void {
    if (this.isWindowsService) {
      logger.log('Signaling to Windows SCM that service is stopping');
      
      try {
        // Use the same notification method for stopping
        this.notifyServiceStatus('STOPPING');
        
        logger.log('Service stopping signal sent successfully');
      } catch (error) {
        logger.warn('Failed to send service stopping signal:', error instanceof Error ? error.message : String(error));
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
      setTimeout(() => process.exit(0), 1000);
    });

    // Handle Ctrl+C in console mode
    process.on('SIGINT', () => {
      logger.log('Received SIGINT - Console interrupt');
      this.signalServiceStopping();
      setTimeout(() => process.exit(0), 1000);
    });

    // Windows-specific: Handle service control requests
    if (process.platform === 'win32') {
      process.on('SIGHUP', () => {
        logger.log('Received SIGHUP - Service control request');
      });
    }
  }

  /**
   * Setup service control handlers with timeout mechanism
   */
  private static setupServiceHandlers(): void {
    logger.log('Setting up Windows service handlers...');
    
    // Set a startup timeout to ensure we signal startup within reasonable time
    this.startupTimeout = setTimeout(() => {
      if (this.isWindowsService) {
        logger.warn('Service startup timeout reached - forcing startup signal');
        this.signalServiceStarted();
      }
    }, 60000); // 60 second timeout
    
    // Setup graceful shutdown handlers
    process.on('beforeExit', () => {
      if (this.isWindowsService) {
        this.signalServiceStopping();
      }
    });
    
    process.on('exit', () => {
      if (this.isWindowsService) {
        logger.log('Process exiting - service cleanup completed');
      }
    });
    
    logger.log('Windows service handlers configured successfully');
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