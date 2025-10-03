import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import * as cron from 'node-cron';
import { LicensingService } from './licensing.service';
import { TokenStore } from './token.store';

@Injectable()
export class LicensingRenewalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LicensingRenewalService.name);
  private renewalTask: cron.ScheduledTask | null = null;
  private renewalIntervalHours: number;
  private offlineGraceDays: number;

  constructor(
    private readonly licensingService: LicensingService,
    private readonly tokenStore: TokenStore,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {
    this.renewalIntervalHours = parseInt(process.env.RENEW_INTERVAL_HOURS || '6', 10);
    this.offlineGraceDays = parseInt(process.env.OFFLINE_GRACE_DAYS || '7', 10);
  }

  async onModuleInit() {
    // Start the renewal service
    await this.startRenewalService();
  }

  onModuleDestroy() {
    // Clean up the renewal task
    this.stopRenewalService();
  }

  private async startRenewalService() {
    try {
      // Check if licensing is enforced
      const licensingEnforced = process.env.LICENSING_ENFORCED === 'true';
      
      if (!licensingEnforced) {
        this.logger.log('Licensing not enforced - renewal service disabled');
        return;
      }

      // Schedule renewal check every X hours
      const cronExpression = `0 */${this.renewalIntervalHours} * * *`; // Every X hours
      
      this.renewalTask = cron.schedule(cronExpression, async () => {
        await this.checkAndRenewLicense();
      });

      // Start the scheduled task
      this.renewalTask.start();
      
      // Also run an initial check
      await this.checkAndRenewLicense();

      this.logger.log(`License renewal service started - checking every ${this.renewalIntervalHours} hours`);
    } catch (error) {
      this.logger.error('Failed to start renewal service', error);
    }
  }

  private stopRenewalService() {
    if (this.renewalTask) {
      this.renewalTask.stop();
      this.renewalTask.destroy();
      this.renewalTask = null;
      this.logger.log('License renewal service stopped');
    }
  }

  private async checkAndRenewLicense() {
    try {
      this.logger.debug('Checking license renewal status');

      // Get current license
      const currentLicense = await this.licensingService.getCurrentLicense();
      
      if (!currentLicense) {
        this.logger.warn('No current license found - skipping renewal check');
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = currentLicense.exp - now;
      const renewalThreshold = 24 * 3600; // 24 hours in seconds

      // Check if we need to renew (less than 24 hours until expiry)
      if (timeUntilExpiry <= renewalThreshold) {
        this.logger.log(`License expires in ${Math.floor(timeUntilExpiry / 3600)} hours - attempting renewal`);
        
        try {
          // Attempt to renew the license
          const renewalResult = await this.licensingService.activateLicense(
            currentLicense.tid,
            currentLicense.did
          );

          if (renewalResult.status === 'activated') {
            this.logger.log('License renewed successfully');
          } else {
            this.logger.warn('License renewal failed', renewalResult.message);
            await this.handleRenewalFailure(currentLicense);
          }
        } catch (error) {
          this.logger.error('License renewal failed due to error', error);
          await this.handleRenewalFailure(currentLicense);
        }
      } else {
        this.logger.debug(`License is valid for ${Math.floor(timeUntilExpiry / 3600)} more hours`);
      }
    } catch (error) {
      this.logger.error('Error during license renewal check', error);
    }
  }

  private async handleRenewalFailure(currentLicense: any) {
    const now = Math.floor(Date.now() / 1000);
    const graceEndTime = currentLicense.exp + (currentLicense.grace * 86400); // grace in seconds
    
    if (now < graceEndTime) {
      const graceTimeLeft = graceEndTime - now;
      const graceDaysLeft = Math.floor(graceTimeLeft / 86400);
      
      this.logger.warn(
        `License renewal failed but still within grace period - ${graceDaysLeft} days remaining`
      );
    } else {
      this.logger.error('License expired and outside grace period - application should be restricted');
      
      // Optionally, you could emit an event here to notify other parts of the application
      // that the license has expired and the application should be restricted
    }
  }

  // Public method to manually trigger a renewal check
  async triggerRenewalCheck(): Promise<void> {
    this.logger.log('Manual renewal check triggered');
    await this.checkAndRenewLicense();
  }

  // Public method to get renewal status
  async getRenewalStatus(): Promise<{
    nextCheck: Date | null;
    isActive: boolean;
    intervalHours: number;
  }> {
    return {
      nextCheck: this.renewalTask ? new Date(Date.now() + this.renewalIntervalHours * 3600 * 1000) : null,
      isActive: this.renewalTask !== null,
      intervalHours: this.renewalIntervalHours
    };
  }
}