import { Test, TestingModule } from '@nestjs/testing';
import { AutoUpdateService } from './auto-update.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';

jest.mock('fs-extra');
jest.mock('axios');
jest.mock('child_process');

describe('AutoUpdateService', () => {
  let service: AutoUpdateService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoUpdateService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AutoUpdateService>(AutoUpdateService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    
    // Mock config values
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'GITHUB_REPO':
          return 'owner/repo';
        case 'GITHUB_TOKEN':
          return 'test-token';
        default:
          return undefined;
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentVersion', () => {
    it('should return current version from package.json', () => {
      const mockPackageJson = { version: '1.0.0' };
      (fs.readJsonSync as jest.Mock).mockReturnValue(mockPackageJson);

      const version = service.getCurrentVersion();

      expect(version).toBe('1.0.0');
      expect(fs.readJsonSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      );
    });

    it('should return 0.0.0 if package.json cannot be read', () => {
      (fs.readJsonSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      const version = service.getCurrentVersion();

      expect(version).toBe('0.0.0');
    });
  });

  describe('checkForUpdates', () => {
    it('should return update info when newer version is available', async () => {
      const mockRelease = {
        tag_name: 'v2.0.0',
        name: 'Version 2.0.0',
        body: 'Release notes',
        assets: [
          {
            name: 'app-win32-x64.exe',
            browser_download_url: 'https://github.com/owner/repo/releases/download/v2.0.0/app-win32-x64.exe',
          },
        ],
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: mockRelease });
      (fs.readJsonSync as jest.Mock).mockReturnValue({ version: '1.0.0' });

      const updateInfo = await service.checkForUpdates();

      expect(updateInfo.hasUpdate).toBe(true);
      expect(updateInfo.latestVersion).toBe('2.0.0');
      expect(updateInfo.currentVersion).toBe('1.0.0');
      expect(updateInfo.releaseNotes).toBe('Release notes');
    });

    it('should return no update when current version is latest', async () => {
      const mockRelease = {
        tag_name: 'v1.0.0',
        name: 'Version 1.0.0',
        body: 'Release notes',
        assets: [],
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: mockRelease });
      (fs.readJsonSync as jest.Mock).mockReturnValue({ version: '1.0.0' });

      const updateInfo = await service.checkForUpdates();

      expect(updateInfo.hasUpdate).toBe(false);
      expect(updateInfo.latestVersion).toBe('1.0.0');
      expect(updateInfo.currentVersion).toBe('1.0.0');
    });

    it('should handle API errors gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));
      (fs.readJsonSync as jest.Mock).mockReturnValue({ version: '1.0.0' });

      await expect(service.checkForUpdates()).rejects.toThrow('API Error');
    });
  });

  describe('getUpdateProgress', () => {
    it('should return initial progress state', () => {
      const progress = service.getUpdateProgress();

      expect(progress.isUpdating).toBe(false);
      expect(progress.progress).toBe(0);
      expect(progress.status).toBe('idle');
    });
  });

  describe('getPlatformAssetName', () => {
    it('should return correct asset name for Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const assetName = (service as any).getPlatformAssetName();

      expect(assetName).toBe('f-flow-client-win32-x64.exe');
    });

    it('should return correct asset name for macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const assetName = (service as any).getPlatformAssetName();

      expect(assetName).toBe('f-flow-client-darwin-x64.dmg');
    });

    it('should return correct asset name for Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const assetName = (service as any).getPlatformAssetName();

      expect(assetName).toBe('f-flow-client-linux-x64.AppImage');
    });
  });
});