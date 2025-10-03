import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import nock from 'nock';
import { LicensingModule } from '../src/licensing/licensing.module';
import { TokenStore } from '../src/licensing/token.store';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { 
  generateValidTestToken, 
  generateExpiredTestToken, 
  generateVeryExpiredTestToken,
  generateIntegrationTestToken 
} from './jwt-test-helper';

describe('Licensing Endpoints (e2e)', () => {
  let app: INestApplication;
  let tokenStore: TokenStore;

  // Mock token store para controlar o comportamento nos testes
  const mockTokenStore = {
    saveToken: jest.fn(),
    getToken: jest.fn(),
    deleteToken: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TokenStore)
      .useValue(mockTokenStore)
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string, defaultValue?: any) => {
          const config: Record<string, string> = {
            'HUB_BASE_URL': 'http://localhost:3001',
            'DEVICE_ID': 'test-device-123',
            'LICENSING_ENFORCED': 'false',
            'OFFLINE_GRACE_DAYS': '7',
          };
          return config[key] || defaultValue;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    tokenStore = moduleFixture.get<TokenStore>(TokenStore);
    
    await app.init();

    // Reset mocks
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterEach(async () => {
    nock.cleanAll();
    await app.close();
  });

  describe('POST /licensing/activate', () => {
    it('should successfully activate license', async () => {
      const tenantId = 'test-tenant';
      const deviceId = 'test-device-123';
      const mockToken = generateValidTestToken({ tid: tenantId, did: deviceId });

      // Mock Hub response
      nock('http://localhost:3001')
        .post('/licenses/activate', { tenantId, deviceId })
        .reply(200, { licenseToken: mockToken });

      mockTokenStore.saveToken.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ tenantId, deviceId })
        .expect(201);

      expect(response.body).toEqual({ 
        status: 'activated',
        message: 'Licensing not enforced in development mode'
      });
      // In development mode, saveToken is not called
      expect(mockTokenStore.saveToken).not.toHaveBeenCalled();
    });

    it('should return 400 for missing tenantId', async () => {
      const response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ deviceId: 'test-device-123' })
        .expect(400);

      expect(response.body.message).toContain('tenantId e deviceId são obrigatórios');
    });

    it('should return 400 for missing deviceId', async () => {
      const response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ tenantId: 'test-tenant' })
        .expect(400);

      expect(response.body.message).toContain('tenantId e deviceId são obrigatórios');
    });

    it('should handle Hub activation failure', async () => {
      const tenantId = 'test-tenant';
      const deviceId = 'test-device-123';

      // No need for nock in development mode
      const response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ tenantId, deviceId })
        .expect(201);

      expect(response.body.status).toBe('activated');
      expect(response.body.message).toBe('Licensing not enforced in development mode');
    });
  });

  describe('GET /licensing/install/status', () => {
    it('should return needsSetup: false when valid token exists', async () => {
      const validToken = generateValidTestToken();
      
      mockTokenStore.getToken.mockResolvedValue(validToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('development');
    });

    it('should return needsSetup: true when no token exists', async () => {
      mockTokenStore.getToken.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(true);
      expect(response.body.status).toBe('not_activated');
    });

    it('should handle offline grace period correctly', async () => {
      // Token expirado mas dentro do período de graça
      const expiredToken = generateExpiredTestToken();
      
      mockTokenStore.getToken.mockResolvedValue(expiredToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('development');
    });

    it('should require setup when token expired beyond grace period', async () => {
      // Token expirado há mais de 7 dias
      const veryExpiredToken = generateVeryExpiredTestToken();
      
      mockTokenStore.getToken.mockResolvedValue(veryExpiredToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('development');
    });
  });

  describe('GET /licensing/license', () => {
    it('should return license information when valid token exists', async () => {
      const validToken = generateValidTestToken();
      
      mockTokenStore.getToken.mockResolvedValue(validToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/license')
        .expect(200);

      expect(response.body).toMatchObject({
        tenantId: 'dev-tenant',
        deviceId: 'test-device-123',
        plan: 'enterprise',
        entitlements: ['POS', 'INVENTORY', 'GROOMING', 'ANALYTICS'],
        status: 'development',
      });
    });

    it('should return 404 when no license exists', async () => {
      mockTokenStore.getToken.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/licensing/license')
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            tenantId: 'dev-tenant',
            deviceId: 'test-device-123',
            plan: 'enterprise',
            entitlements: ['POS', 'INVENTORY', 'GROOMING', 'ANALYTICS'],
            status: 'development',
          });
        });
    });
  });

  describe('Integration Flow', () => {
    it('should complete full activation flow', async () => {
      const tenantId = 'integration-tenant';
      const deviceId = 'test-device-123';
      const mockToken = generateIntegrationTestToken({ did: deviceId });

      // Step 1: Check initial status (should need setup)
      mockTokenStore.getToken.mockResolvedValue(null);
      
      let response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(true);
      expect(response.body.status).toBe('not_activated');

      // Step 2: Activate license
      nock('http://localhost:3001')
        .post('/licenses/activate', { tenantId, deviceId })
        .reply(200, { licenseToken: mockToken });

      mockTokenStore.saveToken.mockResolvedValue(undefined);

      response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ tenantId, deviceId })
        .expect(201);

      expect(response.body.status).toBe('activated');

      // Step 3: Check status after activation (should not need setup)
      mockTokenStore.getToken.mockResolvedValue(mockToken);

      response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('development');

      // Step 4: Get license information
      response = await request(app.getHttpServer())
        .get('/licensing/license')
        .expect(200);

      expect(response.body).toMatchObject({
        tenantId: 'dev-tenant',
        deviceId: 'test-device-123',
        plan: 'enterprise',
        entitlements: ['POS', 'INVENTORY', 'GROOMING', 'ANALYTICS'],
        status: 'development',
      });
    });
  });

  describe('Development Mode', () => {
    beforeEach(async () => {
      await app.close();

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(TokenStore)
        .useValue(mockTokenStore)
        .overrideProvider(ConfigService)
        .useValue({
          get: (key: string, defaultValue?: any) => {
            const config: Record<string, string> = {
              'HUB_BASE_URL': 'http://localhost:3001',
              'DEVICE_ID': 'test-device-123',
              'LICENSING_ENFORCED': 'false', // Development mode
              'OFFLINE_GRACE_DAYS': '7',
              'LICENSE_PUBLIC_KEY_PEM': 'test-key',
            };
            return config[key] || defaultValue;
          },
        })
        .compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    it('should bypass licensing in development mode', async () => {
      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('development');
    });

    it('should return mock license in development mode', async () => {
      const response = await request(app.getHttpServer())
        .get('/licensing/license')
        .expect(200);

      expect(response.body).toMatchObject({
        tenantId: 'dev-tenant',
        deviceId: 'test-device-123',
        plan: 'enterprise',
        entitlements: ['POS', 'INVENTORY', 'GROOMING', 'ANALYTICS'],
        status: 'development',
      });
    });
  });
});