/**
 * JWT Test Helper
 * Generates JWT tokens dynamically for testing purposes
 * Replaces hardcoded tokens to avoid security alerts
 */

export interface TestTokenPayload {
  tid: string; // tenant ID
  did: string; // device ID
  plan: string;
  ent: string[]; // entitlements
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  iss: string; // issuer
  grace?: number; // grace period in days
}

/**
 * Creates a base64url encoded string (without padding)
 */
function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generates a test JWT token with the given payload
 * Note: This is for testing only and uses a mock signature
 */
export function generateTestJWT(payload: Partial<TestTokenPayload> = {}): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'license-key'
  };

  const defaultPayload: TestTokenPayload = {
    tid: 'test-tenant',
    did: 'test-device-123',
    plan: 'pro',
    ent: ['POS', 'INVENTORY'],
    exp: 9999999999, // Far future date
    iat: Math.floor(Date.now() / 1000),
    iss: 'f-flow-hub',
    grace: 7,
    ...payload
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(defaultPayload));
  const mockSignature = 'test-signature';

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Generates a valid test token (not expired)
 */
export function generateValidTestToken(overrides: Partial<TestTokenPayload> = {}): string {
  return generateTestJWT({
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
    ...overrides
  });
}

/**
 * Generates an expired test token
 */
export function generateExpiredTestToken(overrides: Partial<TestTokenPayload> = {}): string {
  return generateTestJWT({
    exp: Math.floor(Date.now() / 1000) - (24 * 60 * 60), // 1 day ago
    ...overrides
  });
}

/**
 * Generates a very expired test token (beyond grace period)
 */
export function generateVeryExpiredTestToken(overrides: Partial<TestTokenPayload> = {}): string {
  return generateTestJWT({
    exp: Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60), // 10 days ago
    ...overrides
  });
}

/**
 * Generates a token for integration tests
 */
export function generateIntegrationTestToken(overrides: Partial<TestTokenPayload> = {}): string {
  return generateTestJWT({
    tid: 'integration-tenant',
    ...overrides
  });
}