import { Test, TestingModule } from '@nestjs/testing';
import { AutoUpdateController } from './auto-update.controller';
import { AutoUpdateService, UpdateInfo, UpdateProgress } from './auto-update.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AutoUpdateController', () => {
  let controller: AutoUpdateController;
  let service: AutoUpdateService;

  const mockAutoUpdateService = {
    getCurrentVersion: jest.fn(),
    checkForUpdates: jest.fn(),
    getUpdateProgress: jest.fn(),
    downloadAndInstallUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoUpdateController],
      providers: [
        {
          provide: AutoUpdateService,
          useValue: mockAutoUpdateService,
        },
      ],
    }).compile();

    controller = module.get<AutoUpdateController>(AutoUpdateController);
    service = module.get<AutoUpdateService>(AutoUpdateService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentVersion', () => {
    it('should return current version', () => {
      mockAutoUpdateService.getCurrentVersion.mockReturnValue('1.0.0');

      const result = controller.getCurrentVersion();

      expect(result).toEqual({ version: '1.0.0' });
      expect(service.getCurrentVersion).toHaveBeenCalled();
    });
  });

  describe('checkForUpdates', () => {
    it('should return update info when successful', async () => {
      const mockUpdateInfo: UpdateInfo = {
        hasUpdate: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        releaseNotes: 'New features',
        downloadUrl: 'https://example.com/download',
      };

      mockAutoUpdateService.checkForUpdates.mockResolvedValue(mockUpdateInfo);

      const result = await controller.checkForUpdates();

      expect(result).toEqual(mockUpdateInfo);
      expect(service.checkForUpdates).toHaveBeenCalled();
    });

    it('should throw HttpException when service fails', async () => {
      const error = new Error('Network error');
      mockAutoUpdateService.checkForUpdates.mockRejectedValue(error);

      await expect(controller.checkForUpdates()).rejects.toThrow(HttpException);
      
      try {
        await controller.checkForUpdates();
      } catch (e) {
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(e.getResponse()).toEqual({
          message: 'Failed to check for updates',
          error: 'Network error',
        });
      }
    });
  });

  describe('getUpdateProgress', () => {
    it('should return update progress', () => {
      const mockProgress: UpdateProgress = {
        isUpdating: false,
        progress: 0,
        status: 'idle',
      };

      mockAutoUpdateService.getUpdateProgress.mockReturnValue(mockProgress);

      const result = controller.getUpdateProgress();

      expect(result).toEqual(mockProgress);
      expect(service.getUpdateProgress).toHaveBeenCalled();
    });
  });

  describe('installUpdate', () => {
    it('should start update installation', async () => {
      mockAutoUpdateService.downloadAndInstallUpdate.mockResolvedValue(undefined);

      const result = await controller.installUpdate();

      expect(result).toEqual({
        message: 'Update installation started. Check progress endpoint for status.',
      });
      expect(service.downloadAndInstallUpdate).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Installation failed');
      mockAutoUpdateService.downloadAndInstallUpdate.mockRejectedValue(error);

      // The controller catches the error in the async call, so it should not throw
      const result = await controller.installUpdate();

      expect(result).toEqual({
        message: 'Update installation started. Check progress endpoint for status.',
      });
    });
  });
});