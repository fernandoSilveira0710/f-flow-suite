import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import nock from 'nock';
import { LicensingService } from './licensing.service';
import { TokenStore } from './token.store';

// Mock do módulo jose
jest.mock('jose', () => ({
  importSPKI: jest.fn(),
  jwtVerify: jest.fn(),
  decodeJwt: jest.fn(),
  SignJWT: jest.fn(),
}));

// Mock do TokenStore
const mockTokenStore = {
  getToken: jest.fn(),
  saveToken: jest.fn(),
  clearToken: jest.fn(),
};

// Mock do ConfigService
const mockConfigService = {
  get: jest.fn(),
};

describe('LicensingService Integration Tests', () => {
  let service: LicensingService;
  let module: TestingModule;

  const testPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
fGnJm6gOdrj8ym3rFkEjWT2btf06kkstX2LvAjYv9bLb4ZjH0bfMQmJlOFWZaGWr
-----END PUBLIC KEY-----`;

  beforeEach(async () => {
    jest.clearAllMocks();
    nock.cleanAll();

    // Configuração padrão para desenvolvimento
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config: Record<string, string> = {
        'HUB_BASE_URL': 'http://localhost:3001',
        'DEVICE_ID': 'test-device-123',
        'LICENSING_ENFORCED': 'false', // Development mode por padrão
        'OFFLINE_GRACE_DAYS': '7',
        'LICENSE_PUBLIC_KEY_PEM': testPublicKey,
      };
      return config[key] || defaultValue;
    });

    module = await Test.createTestingModule({
      providers: [
        LicensingService,
        { provide: TokenStore, useValue: mockTokenStore },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<LicensingService>(LicensingService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('activateLicense', () => {
    it('should activate license successfully', async () => {
      const mockResponse = {
        success: true,
        token: 'valid.jwt.token',
        message: 'License activated successfully'
      };

      nock('http://localhost:3001')
        .post('/licenses/activate')
        .reply(200, mockResponse);

      mockTokenStore.saveToken.mockResolvedValue(undefined);

      const result = await service.activateLicense('test-tenant', 'test-device', 'test-key');

      expect(result).toEqual(mockResponse);
      expect(mockTokenStore.saveToken).toHaveBeenCalledWith('valid.jwt.token');
    });

    it('should handle activation failure', async () => {
      nock('http://localhost:3001')
        .post('/licenses/activate')
        .reply(400, { success: false, message: 'Invalid license key' });

      await expect(
        service.activateLicense('test-tenant', 'test-device', 'invalid-key')
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getInstallStatus', () => {
    it('should return needsSetup true when no token exists', async () => {
      mockTokenStore.getToken.mockResolvedValue(null);

      const result = await service.getInstallStatus();

      expect(result).toEqual({
        needsSetup: true,
        status: 'not_activated'
      });
    });

    it('should return needsSetup false for valid token', async () => {
      const mockToken = 'valid.jwt.token';
      const mockDecodedToken = {
        tid: 'tenant-123',
        did: 'device-456',
        plan: 'enterprise',
        ent: ['POS', 'INVENTORY'],
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        grace: 7,
        iat: Math.floor(Date.now() / 1000),
        iss: 'hub'
      };

      mockTokenStore.getToken.mockResolvedValue(mockToken);
      
      const jose = require('jose');
      jose.decodeJwt.mockReturnValue(mockDecodedToken);

      const result = await service.getInstallStatus();

      expect(result).toEqual({
        needsSetup: false,
        status: 'activated'
      });
    });
  });

  describe('getCurrentLicense', () => {
    it('should return development license in dev mode', async () => {
      const result = await service.getCurrentLicense();

      expect(result).toMatchObject({
        tid: 'dev-tenant',
        plan: 'enterprise',
        status: 'development'
      });
    });
  });

  describe('Development Mode', () => {
    it('should bypass licensing when LICENSING_ENFORCED is false', async () => {
      const installStatus = await service.getInstallStatus();
      const currentLicense = await service.getCurrentLicense();

      expect(installStatus.needsSetup).toBe(false);
      expect(currentLicense?.status).toBe('development');
    });
  });
});