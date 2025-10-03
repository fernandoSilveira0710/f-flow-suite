jest.mock('axios');

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import nock from 'nock';
import { LicensingService } from './licensing.service';
import { TokenStore } from './token.store';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Limpar todos os interceptors do nock antes de cada teste
beforeEach(() => {
  nock.cleanAll();
  jest.clearAllMocks();
});

afterEach(() => {
  nock.cleanAll();
});

// Mock do módulo jose
jest.mock('jose', () => ({
  importSPKI: jest.fn(),
  jwtVerify: jest.fn(),
  decodeJwt: jest.fn(),
  SignJWT: jest.fn(),
}));

// Mock do TokenStore
const mockTokenStore = {
  getToken: jest.fn().mockImplementation((tenantId?: string, deviceId?: string) => Promise.resolve(null)),
  saveToken: jest.fn().mockImplementation((tenantId: string, deviceId: string, token: string) => Promise.resolve()),
  clearToken: jest.fn().mockImplementation(() => Promise.resolve()),
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
    // Clear all mocks
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
    it.skip('should activate license successfully', async () => {
      // Configurar para modo de produção para este teste
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, string> = {
          'HUB_BASE_URL': 'http://localhost:3001',
          'DEVICE_ID': 'test-device-123',
          'LICENSING_ENFORCED': 'true', // Production mode
          'OFFLINE_GRACE_DAYS': '7',
          'LICENSE_PUBLIC_KEY_PEM': testPublicKey,
        };
        return config[key] || defaultValue;
      });

      // Recriar o serviço com a nova configuração
      const testModule = await Test.createTestingModule({
        providers: [
          LicensingService,
          { provide: TokenStore, useValue: mockTokenStore },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testService = testModule.get<LicensingService>(LicensingService);

      const mockResponse = {
        data: {
          success: true,
          licenseToken: 'valid.jwt.token',
          message: 'License activated successfully'
        }
      };

      // Mock do axios.post
      mockedAxios.post.mockResolvedValue(mockResponse);

      mockTokenStore.saveToken.mockResolvedValue(undefined);

      // Mock do jose para validação do token
      const jose = require('jose');
      jose.importSPKI = jest.fn().mockResolvedValue('mocked-public-key');
      jose.jwtVerify = jest.fn().mockResolvedValue({
        payload: {
          tid: 'test-tenant',
          did: 'test-device',
          plan: 'pro',
          ent: ['POS', 'INVENTORY'],
          exp: Math.floor(Date.now() / 1000) + 3600,
          grace: 7,
          iat: Math.floor(Date.now() / 1000),
          iss: 'hub'
        }
      });

      const result = await testService.activateLicense('test-tenant', 'test-device', 'test-key');

      expect(result.status).toBe('activated');
      expect(mockTokenStore.saveToken).toHaveBeenCalledWith('test-tenant', 'test-device', 'valid.jwt.token');
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/licenses/activate', {
        tenantId: 'test-tenant',
        deviceId: 'test-device',
        licenseKey: 'test-key'
      });
    });

    it('should handle activation failure', async () => {
      // Configurar para modo de produção para este teste
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, string> = {
          'HUB_BASE_URL': 'http://localhost:3001',
          'DEVICE_ID': 'test-device-123',
          'LICENSING_ENFORCED': 'true', // Production mode
          'OFFLINE_GRACE_DAYS': '7',
          'LICENSE_PUBLIC_KEY_PEM': testPublicKey,
        };
        return config[key] || defaultValue;
      });

      // Recriar o serviço com a nova configuração
      const testModule = await Test.createTestingModule({
        providers: [
          LicensingService,
          { provide: TokenStore, useValue: mockTokenStore },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testService = testModule.get<LicensingService>(LicensingService);

      // Mock do axios.post para simular erro
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { success: false, message: 'Invalid license key' }
        }
      });

      await expect(
        testService.activateLicense('test-tenant', 'test-device', 'invalid-key')
      ).rejects.toThrow();
    });
  });

  describe('getInstallStatus', () => {
    it('should return needsSetup true when no token exists', async () => {
      // Configurar para modo de produção para este teste
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, string> = {
          'HUB_BASE_URL': 'http://localhost:3001',
          'DEVICE_ID': 'test-device-123',
          'LICENSING_ENFORCED': 'true', // Production mode
          'OFFLINE_GRACE_DAYS': '7',
          'LICENSE_PUBLIC_KEY_PEM': testPublicKey,
        };
        return config[key] || defaultValue;
      });

      // Recriar o serviço com a nova configuração
      const testModule = await Test.createTestingModule({
        providers: [
          LicensingService,
          { provide: TokenStore, useValue: mockTokenStore },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testService = testModule.get<LicensingService>(LicensingService);
      mockTokenStore.getToken.mockResolvedValue(null);

      const result = await testService.getInstallStatus();

      expect(result).toEqual({
        needsSetup: true,
        status: 'not_activated'
      });
    });

    it('should return needsSetup false for valid token', async () => {
      // Configurar para modo de produção para este teste
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, string> = {
          'HUB_BASE_URL': 'http://localhost:3001',
          'DEVICE_ID': 'test-device-123',
          'LICENSING_ENFORCED': 'true', // Production mode
          'OFFLINE_GRACE_DAYS': '7',
          'LICENSE_PUBLIC_KEY_PEM': testPublicKey,
        };
        return config[key] || defaultValue;
      });

      // Recriar o serviço com a nova configuração
      const testModule = await Test.createTestingModule({
        providers: [
          LicensingService,
          { provide: TokenStore, useValue: mockTokenStore },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const testService = testModule.get<LicensingService>(LicensingService);
      
      const mockToken = 'valid.jwt.token';
      const mockDecodedToken = {
        tid: 'tenant-123',
        did: 'device-456',
        plan: 'enterprise',
        ent: ['POS', 'INVENTORY'],
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        grace: 7,
        iat: Math.floor(Date.now() / 1000),
        iss: 'hub'
      };

      // Mock getToken para retornar o token
      mockTokenStore.getToken.mockResolvedValue(mockToken);
      
      // Mock do jose antes de chamar o serviço
      jest.doMock('jose', () => ({
        importSPKI: jest.fn().mockResolvedValue('mocked-public-key'),
        jwtVerify: jest.fn().mockResolvedValue({
          payload: mockDecodedToken
        }),
        decodeJwt: jest.fn().mockReturnValue(mockDecodedToken)
      }));

      const result = await testService.getInstallStatus();

      expect(result).toEqual({
        needsSetup: false,
        status: 'activated',
        plan: 'enterprise',
        exp: mockDecodedToken.exp,
        grace: 7
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