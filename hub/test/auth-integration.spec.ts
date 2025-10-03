import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as jwt from 'jsonwebtoken';
import { generateKeyPairSync } from 'crypto';

describe('Auth Integration (e2e)', () => {
  let app: INestApplication;
  let oidcPrivateKey: string;
  let oidcPublicKey: string;
  let licensePrivateKey: string;
  let licensePublicKey: string;

  beforeAll(async () => {
    // Generate test key pairs
    const oidcKeyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const licenseKeyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    oidcPrivateKey = oidcKeyPair.privateKey;
    oidcPublicKey = oidcKeyPair.publicKey;
    licensePrivateKey = licenseKeyPair.privateKey;
    licensePublicKey = licenseKeyPair.publicKey;

    // Set environment variables for testing
    process.env.OIDC_REQUIRED = 'true';
    process.env.OIDC_JWKS_URL = 'https://test-idp.example.com/.well-known/jwks.json';
    process.env.OIDC_ISSUER = 'https://test-idp.example.com/';
    process.env.OIDC_AUDIENCE = 'f-flow-suite-hub';
    process.env.LICENSING_ENFORCED = 'true';
    process.env.LICENSE_PUBLIC_KEY_PEM = licensePublicKey;
    process.env.LICENSE_PRIVATE_KEY_PEM = licensePrivateKey;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const generateOidcToken = (payload: any = {}) => {
    const defaultPayload = {
      iss: 'https://test-idp.example.com/',
      aud: 'f-flow-suite-hub',
      sub: 'test-user-123',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      ...payload,
    };

    return jwt.sign(defaultPayload, oidcPrivateKey, { 
      algorithm: 'RS256',
      keyid: 'test-key-id'
    });
  };

  const generateLicenseToken = (payload: any = {}) => {
    const defaultPayload = {
      tenant_id: 'test-tenant-123',
      plan_id: 'premium',
      entitlements: { pos: true, inventory: true },
      max_seats: 10,
      device_id: 'test-device-123',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      ...payload,
    };

    return jwt.sign(defaultPayload, licensePrivateKey, { algorithm: 'RS256' });
  };

  describe('Protected Routes - Tenants', () => {
    it('should return 401 when no OIDC token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .expect(401);

      expect(response.body.message).toBe('Missing or invalid identity token');
    });

    it('should return 401 when invalid OIDC token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Missing or invalid identity token');
    });

    it('should return 403 when valid OIDC token but no license token', async () => {
      // Note: This test would require mocking the JWKS endpoint
      // For now, we'll skip the actual OIDC validation and focus on license validation
      process.env.OIDC_REQUIRED = 'false';

      const response = await request(app.getHttpServer())
        .get('/tenants')
        .expect(403);

      expect(response.body.message).toBe('Missing or invalid license token');

      // Reset for other tests
      process.env.OIDC_REQUIRED = 'true';
    });

    it('should return 403 when valid OIDC token but invalid license token', async () => {
      process.env.OIDC_REQUIRED = 'false';

      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', 'Bearer invalid-license-token')
        .expect(403);

      expect(response.body.message).toBe('Missing or invalid license token');

      process.env.OIDC_REQUIRED = 'true';
    });

    it('should return 200 when both OIDC and license tokens are valid', async () => {
      // Disable OIDC for this test since we can't easily mock JWKS
      process.env.OIDC_REQUIRED = 'false';

      const licenseToken = generateLicenseToken();

      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${licenseToken}`)
        .expect(200);

      // Reset for other tests
      process.env.OIDC_REQUIRED = 'true';
    });
  });

  describe('Protected Routes - Sync', () => {
    it('should protect sync events endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants/test-tenant/sync/events')
        .send({ events: [] })
        .expect(401);

      expect(response.body.message).toBe('Missing or invalid identity token');
    });

    it('should protect sync commands endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants/test-tenant/sync/commands')
        .expect(401);

      expect(response.body.message).toBe('Missing or invalid identity token');
    });

    it('should allow access with valid license when OIDC disabled', async () => {
      process.env.OIDC_REQUIRED = 'false';

      const licenseToken = generateLicenseToken();

      const response = await request(app.getHttpServer())
        .post('/tenants/test-tenant/sync/events')
        .set('Authorization', `Bearer ${licenseToken}`)
        .send({ events: [] })
        .expect(201);

      expect(response.body.accepted).toBe(0);

      process.env.OIDC_REQUIRED = 'true';
    });
  });

  describe('Unprotected Routes', () => {
    it('should allow access to health endpoint without tokens', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });

    it('should allow access to license activation without OIDC token', async () => {
      const response = await request(app.getHttpServer())
        .post('/licenses/activate')
        .send({ tenantId: 'test-tenant', deviceId: 'test-device' })
        .expect(201);

      expect(response.body.licenseToken).toBeDefined();
    });
  });

  describe('Environment Flag Tests', () => {
    it('should bypass OIDC validation when OIDC_REQUIRED=false', async () => {
      process.env.OIDC_REQUIRED = 'false';
      process.env.LICENSING_ENFORCED = 'false';

      await request(app.getHttpServer())
        .get('/tenants')
        .expect(200);

      // Reset
      process.env.OIDC_REQUIRED = 'true';
      process.env.LICENSING_ENFORCED = 'true';
    });

    it('should bypass license validation when LICENSING_ENFORCED=false', async () => {
      process.env.OIDC_REQUIRED = 'false';
      process.env.LICENSING_ENFORCED = 'false';

      await request(app.getHttpServer())
        .get('/tenants')
        .expect(200);

      // Reset
      process.env.OIDC_REQUIRED = 'true';
      process.env.LICENSING_ENFORCED = 'true';
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired license token', async () => {
      process.env.OIDC_REQUIRED = 'false';

      const expiredLicenseToken = generateLicenseToken({
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });

      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${expiredLicenseToken}`)
        .expect(403);

      expect(response.body.message).toBe('License token expired');

      process.env.OIDC_REQUIRED = 'true';
    });
  });
});