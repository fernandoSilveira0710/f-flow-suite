import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { existsSync, createWriteStream, chmodSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, platform } from 'os';
import { spawn } from 'child_process';
import * as semver from 'semver';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
}

export interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'installing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

@Injectable()
export class AutoUpdateService {
  private readonly logger = new Logger(AutoUpdateService.name);
  private readonly githubRepo = '2fsolutions/f-flow-suite';
  private readonly currentVersion: string;
  private updateInProgress = false;
  private updateProgress: UpdateProgress = {
    stage: 'checking',
    progress: 0,
    message: 'Idle',
  };

  constructor() {
    // Get current version from package.json
    try {
      const packageJson = require('../../package.json');
      this.currentVersion = packageJson.version;
    } catch (error) {
      this.logger.warn('Could not read package.json version, using 0.0.1');
      this.currentVersion = '0.0.1';
    }
  }

  /**
   * Check for updates every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkForUpdatesScheduled(): Promise<void> {
    if (this.updateInProgress) {
      this.logger.debug('Update already in progress, skipping scheduled check');
      return;
    }

    try {
      const updateInfo = await this.checkForUpdates();
      if (updateInfo.available) {
        this.logger.log(
          `New version available: ${updateInfo.latestVersion} (current: ${updateInfo.currentVersion})`
        );
        // Note: Auto-download is disabled by default for safety
        // Users need to manually trigger the update via API
      }
    } catch (error) {
      this.logger.error('Scheduled update check failed:', error);
    }
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      this.logger.debug('Checking for updates...');
      
      const response = await axios.get(
        `https://api.github.com/repos/${this.githubRepo}/releases/latest`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'F-Flow-Client-Local-Updater',
          },
        }
      );

      const release = response.data;
      const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
      
      const isNewer = semver.gt(latestVersion, this.currentVersion);
      
      if (!isNewer) {
        return {
          available: false,
          currentVersion: this.currentVersion,
          latestVersion,
        };
      }

      // Find the appropriate asset for current platform
      const platformAsset = this.findPlatformAsset(release.assets);
      
      return {
        available: true,
        currentVersion: this.currentVersion,
        latestVersion,
        downloadUrl: platformAsset?.browser_download_url,
        releaseNotes: release.body,
        publishedAt: release.published_at,
      };
    } catch (error) {
      this.logger.error('Failed to check for updates:', error);
      throw new Error(`Update check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download and install update
   */
  async downloadAndInstallUpdate(): Promise<void> {
    if (this.updateInProgress) {
      throw new Error('Update already in progress');
    }

    try {
      this.updateInProgress = true;
      this.updateProgress = {
        stage: 'checking',
        progress: 0,
        message: 'Checking for updates...',
      };

      const updateInfo = await this.checkForUpdates();
      
      if (!updateInfo.available) {
        throw new Error('No updates available');
      }

      if (!updateInfo.downloadUrl) {
        throw new Error('No download URL available for current platform');
      }

      this.updateProgress = {
        stage: 'downloading',
        progress: 10,
        message: `Downloading version ${updateInfo.latestVersion}...`,
      };

      const downloadPath = await this.downloadUpdate(updateInfo.downloadUrl);
      
      this.updateProgress = {
        stage: 'installing',
        progress: 80,
        message: 'Installing update...',
      };

      await this.installUpdate(downloadPath);
      
      this.updateProgress = {
        stage: 'completed',
        progress: 100,
        message: 'Update completed successfully. Restart required.',
      };

      this.logger.log('Update completed successfully');
    } catch (error) {
      this.logger.error('Update failed:', error);
      this.updateProgress = {
        stage: 'error',
        progress: 0,
        message: 'Update failed',
        error: error instanceof Error ? error.message : String(error),
      };
      throw error;
    } finally {
      this.updateInProgress = false;
    }
  }

  /**
   * Get current update progress
   */
  getUpdateProgress(): UpdateProgress {
    return { ...this.updateProgress };
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Find the appropriate asset for current platform
   */
  private findPlatformAsset(assets: any[]): any {
    const currentPlatform = platform();
    const arch = process.arch;
    
    // Platform-specific asset patterns
    const patterns: Record<string, RegExp> = {
      win32: /f-flow-client.*win.*\.(exe|zip)$/i,
      darwin: /f-flow-client.*mac.*\.(dmg|pkg|zip)$/i,
      linux: /f-flow-client.*linux.*\.(deb|rpm|tar\.gz|zip)$/i,
    };

    const pattern = patterns[currentPlatform];
    if (!pattern) {
      this.logger.warn(`No asset pattern defined for platform: ${currentPlatform}`);
      return null;
    }

    return assets.find(asset => pattern.test(asset.name));
  }

  /**
   * Download update file
   */
  private async downloadUpdate(downloadUrl: string): Promise<string> {
    const tempDir = this.getTempDirectory();
    const fileName = downloadUrl.split('/').pop() || 'f-flow-update';
    const downloadPath = join(tempDir, fileName);

    this.logger.debug(`Downloading update to: ${downloadPath}`);

    return new Promise((resolve, reject) => {
      axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream',
        timeout: 300000, // 5 minutes
      })
        .then(response => {
          const totalLength = parseInt(response.headers['content-length'] || '0', 10);
          let downloadedLength = 0;

          const writer = createWriteStream(downloadPath);
          
          response.data.on('data', (chunk: Buffer) => {
            downloadedLength += chunk.length;
            if (totalLength > 0) {
              const progress = Math.round((downloadedLength / totalLength) * 60) + 10; // 10-70%
              this.updateProgress = {
                ...this.updateProgress,
                progress,
                message: `Downloading... ${Math.round((downloadedLength / totalLength) * 100)}%`,
              };
            }
          });

          response.data.pipe(writer);

          writer.on('finish', () => {
            this.updateProgress = {
              ...this.updateProgress,
              progress: 70,
              message: 'Download completed',
            };
            resolve(downloadPath);
          });

          writer.on('error', reject);
        })
        .catch(reject);
    });
  }

  /**
   * Install downloaded update
   */
  private async installUpdate(downloadPath: string): Promise<void> {
    const currentPlatform = platform();
    
    try {
      switch (currentPlatform) {
        case 'win32':
          await this.installWindowsUpdate(downloadPath);
          break;
        case 'darwin':
          await this.installMacUpdate(downloadPath);
          break;
        case 'linux':
          await this.installLinuxUpdate(downloadPath);
          break;
        default:
          throw new Error(`Unsupported platform: ${currentPlatform}`);
      }
    } finally {
      // Clean up downloaded file
      try {
        if (existsSync(downloadPath)) {
          unlinkSync(downloadPath);
        }
      } catch (error) {
        this.logger.warn('Failed to clean up download file:', error);
      }
    }
  }

  /**
   * Install update on Windows
   */
  private async installWindowsUpdate(downloadPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // For Windows, we typically run the installer
      const installer = spawn(downloadPath, ['/S'], { // /S for silent install
        detached: true,
        stdio: 'ignore',
      });

      installer.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installer exited with code ${code}`));
        }
      });

      installer.on('error', reject);
    });
  }

  /**
   * Install update on macOS
   */
  private async installMacUpdate(downloadPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // For macOS, handle different file types
      if (downloadPath.endsWith('.dmg')) {
        // Mount DMG and copy application
        const mountProcess = spawn('hdiutil', ['attach', downloadPath, '-nobrowse']);
        mountProcess.on('close', (code) => {
          if (code === 0) {
            // Implementation would continue with copying the app
            resolve();
          } else {
            reject(new Error(`Failed to mount DMG: ${code}`));
          }
        });
      } else if (downloadPath.endsWith('.pkg')) {
        // Install PKG
        const installer = spawn('installer', ['-pkg', downloadPath, '-target', '/']);
        installer.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`PKG installer failed: ${code}`));
          }
        });
      } else {
        reject(new Error('Unsupported macOS installer format'));
      }
    });
  }

  /**
   * Install update on Linux
   */
  private async installLinuxUpdate(downloadPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (downloadPath.endsWith('.deb')) {
        // Install DEB package
        const installer = spawn('dpkg', ['-i', downloadPath]);
        installer.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`DEB installer failed: ${code}`));
          }
        });
      } else if (downloadPath.endsWith('.rpm')) {
        // Install RPM package
        const installer = spawn('rpm', ['-U', downloadPath]);
        installer.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`RPM installer failed: ${code}`));
          }
        });
      } else {
        reject(new Error('Unsupported Linux installer format'));
      }
    });
  }

  /**
   * Get temporary directory for downloads
   */
  private getTempDirectory(): string {
    const isWindows = platform() === 'win32';
    const home = homedir();
    
    if (isWindows) {
      return process.env.TEMP || process.env.TMP || join(home, 'AppData', 'Local', 'Temp');
    } else {
      return '/tmp';
    }
  }
}