import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import nock from 'nock';
import { AppModule } from '../src/app.module';
import { TokenStore } from '../src/licensing/token.store';

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
            'LICENSING_ENFORCED': 'true',
            'OFFLINE_GRACE_DAYS': '7',
            'LICENSE_PUBLIC_KEY_PEM': `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2K5QZ8vQz8vQz8vQz8vQ
z8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQ
z8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQ
z8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQ
z8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQ
z8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQz8vQ
wIDAQAB
-----END PUBLIC KEY-----`,
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
      const mockToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxpY2Vuc2Uta2V5In0.eyJ0aWQiOiJ0ZXN0LXRlbmFudCIsImRpZCI6InRlc3QtZGV2aWNlLTEyMyIsInBsYW4iOiJwcm8iLCJlbnQiOlsiUE9TIiwiSU5WRU5UT1JZIl0sImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzU5NDkzOTc3LCJpc3MiOiJmLWZsb3ctaHViIn0.test-signature';

      // Mock Hub response
      nock('http://localhost:3001')
        .post('/licenses/activate', { tenantId, deviceId })
        .reply(200, { licenseToken: mockToken });

      mockTokenStore.saveToken.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ tenantId, deviceId })
        .expect(200);

      expect(response.body).toEqual({ status: 'activated' });
      expect(mockTokenStore.saveToken).toHaveBeenCalledWith(mockToken);
    });

    it('should return 400 for missing tenantId', async () => {
      const response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ deviceId: 'test-device-123' })
        .expect(400);

      expect(response.body.message).toContain('tenantId é obrigatório');
    });

    it('should return 400 for missing deviceId', async () => {
      const response = await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ tenantId: 'test-tenant' })
        .expect(400);

      expect(response.body.message).toContain('deviceId é obrigatório');
    });

    it('should handle Hub activation failure', async () => {
      const tenantId = 'invalid-tenant';
      const deviceId = 'test-device-123';

      nock('http://localhost:3001')
        .post('/licenses/activate', { tenantId, deviceId })
        .reply(404, { message: 'LICENSE_NOT_FOUND' });

      await request(app.getHttpServer())
        .post('/licensing/activate')
        .send({ tenantId, deviceId })
        .expect(404);
    });
  });

  describe('GET /install/status', () => {
    it('should return needsSetup: false when valid token exists', async () => {
      const validToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxpY2Vuc2Uta2V5In0.eyJ0aWQiOiJ0ZXN0LXRlbmFudCIsImRpZCI6InRlc3QtZGV2aWNlLTEyMyIsInBsYW4iOiJwcm8iLCJlbnQiOlsiUE9TIiwiSU5WRU5UT1JZIl0sImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzU5NDkzOTc3LCJpc3MiOiJmLWZsb3ctaHViIn0.test-signature';
      
      mockTokenStore.getToken.mockResolvedValue(validToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('activated');
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
      const expiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxpY2Vuc2Uta2V5In0.eyJ0aWQiOiJ0ZXN0LXRlbmFudCIsImRpZCI6InRlc3QtZGV2aWNlLTEyMyIsInBsYW4iOiJwcm8iLCJlbnQiOlsiUE9TIiwiSU5WRU5UT1JZIl0sImV4cCI6MTU1OTQ5Mzk3NywiaWF0IjoxNzU5NDkzOTc3LCJpc3MiOiJmLWZsb3ctaHViIn0.test-signature';
      
      mockTokenStore.getToken.mockResolvedValue(expiredToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('offline_grace');
    });

    it('should require setup when token expired beyond grace period', async () => {
      // Token expirado há mais de 7 dias
      const veryExpiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxpY2Vuc2Uta2V5In0.eyJ0aWQiOiJ0ZXN0LXRlbmFudCIsImRpZCI6InRlc3QtZGV2aWNlLTEyMyIsInBsYW4iOiJwcm8iLCJlbnQiOlsiUE9TIiwiSU5WRU5UT1JZIl0sImV4cCI6MTU1OTQ5Mzk3NywiaWF0IjoxNzU5NDkzOTc3LCJpc3MiOiJmLWZsb3ctaHViIn0.test-signature';
      
      mockTokenStore.getToken.mockResolvedValue(veryExpiredToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(true);
      expect(response.body.status).toBe('expired');
    });
  });

  describe('GET /licensing/license', () => {
    it('should return license information when valid token exists', async () => {
      const validToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxpY2Vuc2Uta2V5In0.eyJ0aWQiOiJ0ZXN0LXRlbmFudCIsImRpZCI6InRlc3QtZGV2aWNlLTEyMyIsInBsYW4iOiJwcm8iLCJlbnQiOlsiUE9TIiwiSU5WRU5UT1JZIl0sImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzU5NDkzOTc3LCJpc3MiOiJmLWZsb3ctaHViIn0.test-signature';
      
      mockTokenStore.getToken.mockResolvedValue(validToken);

      const response = await request(app.getHttpServer())
        .get('/licensing/license')
        .expect(200);

      expect(response.body).toMatchObject({
        tenantId: 'test-tenant',
        deviceId: 'test-device-123',
        plan: 'pro',
        entitlements: ['POS', 'INVENTORY'],
        status: 'activated',
      });
    });

    it('should return 404 when no license exists', async () => {
      mockTokenStore.getToken.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/licensing/license')
        .expect(404);
    });
  });

  describe('Integration Flow', () => {
    it('should complete full activation flow', async () => {
      const tenantId = 'integration-tenant';
      const deviceId = 'test-device-123';
      const mockToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxpY2Vuc2Uta2V5In0.eyJ0aWQiOiJpbnRlZ3JhdGlvbi10ZW5hbnQiLCJkaWQiOiJ0ZXN0LWRldmljZS0xMjMiLCJwbGFuIjoicHJvIiwiZW50IjpbIlBPUyIsIklOVkVOVE9SWSJdLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTc1OTQ5Mzk3NywiaXNzIjoiZi1mbG93LWh1YiJ9.test-signature';

      // Step 1: Check initial status (should need setup)
      mockTokenStore.getToken.mockResolvedValue(null);
      
      let response = await request(app.getHttpServer())
        .get('/install/status')
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
        .expect(200);

      expect(response.body.status).toBe('activated');

      // Step 3: Check status after activation (should not need setup)
      mockTokenStore.getToken.mockResolvedValue(mockToken);

      response = await request(app.getHttpServer())
        .get('/licensing/install/status')
        .expect(200);

      expect(response.body.needsSetup).toBe(false);
      expect(response.body.status).toBe('activated');

      // Step 4: Get license information
      response = await request(app.getHttpServer())
        .get('/licensing/license')
        .expect(200);

      expect(response.body).toMatchObject({
        tenantId: 'integration-tenant',
        deviceId: 'test-device-123',
        plan: 'pro',
        entitlements: ['POS', 'INVENTORY'],
        status: 'activated',
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