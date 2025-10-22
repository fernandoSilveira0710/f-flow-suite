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
      const pkgVersion: string = require('../../package.json').version;
      const version = service.getCurrentVersion();
      expect(version).toBe(pkgVersion);
    });

    it('should return a semantic version string', () => {
      const version = service.getCurrentVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('checkForUpdates', () => {
    it('should return update info when newer version is available', async () => {
      const current = service.getCurrentVersion();
      const mockRelease = {
        tag_name: 'v2.0.0',
        name: 'Version 2.0.0',
        body: 'Release notes',
        assets: [
          {
            name: 'f-flow-client-win-x64.exe',
            browser_download_url: 'https://github.com/owner/repo/releases/download/v2.0.0/f-flow-client-win-x64.exe',
          },
        ],
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: mockRelease });

      const updateInfo = await service.checkForUpdates();

      expect(updateInfo.available).toBe(true);
      expect(updateInfo.latestVersion).toBe('2.0.0');
      expect(updateInfo.currentVersion).toBe(current);
      expect(updateInfo.releaseNotes).toBe('Release notes');
    });

    it('should return no update when current version is latest', async () => {
      const current = service.getCurrentVersion();
      const mockRelease = {
        tag_name: `v${current}`,
        name: `Version ${current}`,
        body: 'Release notes',
        assets: [],
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: mockRelease });

      const updateInfo = await service.checkForUpdates();

      expect(updateInfo.available).toBe(false);
      expect(updateInfo.latestVersion).toBe(current);
      expect(updateInfo.currentVersion).toBe(current);
    });

    it('should handle API errors gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      await expect(service.checkForUpdates()).rejects.toThrow('API Error');
    });
  });

  describe('getUpdateProgress', () => {
    it('should return initial progress state', () => {
      const progress = service.getUpdateProgress();

      expect(progress.stage).toBe('checking');
      expect(progress.progress).toBe(0);
      expect(progress.message).toBe('Idle');
    });
  });

  describe('asset selection', () => {
    it('should select correct downloadUrl for current platform', async () => {
      const current = service.getCurrentVersion();
      const winUrl = 'https://example.com/f-flow-client-win-x64.exe';
      const macUrl = 'https://example.com/f-flow-client-mac-x64.dmg';
      const linUrl = 'https://example.com/f-flow-client-linux-x64.deb';

      const mockRelease = {
        tag_name: 'v999.0.0',
        name: 'Version 999.0.0',
        body: 'Release notes',
        assets: [
          { name: 'f-flow-client-win-x64.exe', browser_download_url: winUrl },
          { name: 'f-flow-client-mac-x64.dmg', browser_download_url: macUrl },
          { name: 'f-flow-client-linux-x64.deb', browser_download_url: linUrl },
        ],
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: mockRelease });

      const info = await service.checkForUpdates();

      const platform = process.platform;
      const expectedUrl = platform === 'win32' ? winUrl : platform === 'darwin' ? macUrl : linUrl;

      expect(info.available).toBe(true);
      expect(info.currentVersion).toBe(current);
      expect(info.downloadUrl).toBe(expectedUrl);
    });
  });
});