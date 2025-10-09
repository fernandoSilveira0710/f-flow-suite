import { Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { AutoUpdateService, UpdateInfo, UpdateProgress } from './auto-update.service';

@Controller('auto-update')
export class AutoUpdateController {
  constructor(private readonly autoUpdateService: AutoUpdateService) {}

  /**
   * Get current version
   */
  @Get('version')
  getCurrentVersion(): { version: string } {
    return {
      version: this.autoUpdateService.getCurrentVersion(),
    };
  }

  /**
   * Check for available updates
   */
  @Get('check')
  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      return await this.autoUpdateService.checkForUpdates();
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to check for updates',
          error: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get current update progress
   */
  @Get('progress')
  getUpdateProgress(): UpdateProgress {
    return this.autoUpdateService.getUpdateProgress();
  }

  /**
   * Download and install update
   */
  @Post('install')
  async installUpdate(): Promise<{ message: string }> {
    try {
      // Start update process asynchronously
      this.autoUpdateService.downloadAndInstallUpdate().catch(error => {
        console.error('Update installation failed:', error);
      });

      return {
        message: 'Update installation started. Check progress endpoint for status.',
      };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to start update installation',
          error: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}