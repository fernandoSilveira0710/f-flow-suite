declare module 'jwks-client' {
  interface JwksClientOptions {
    jwksUri: string;
    cache?: boolean;
    cacheMaxAge?: number;
    rateLimit?: boolean;
    jwksRequestsPerMinute?: number;
  }

  interface SigningKey {
    getPublicKey(): string;
  }

  class JwksClient {
    constructor(options: JwksClientOptions);
    getSigningKey(kid: string): Promise<SigningKey>;
  }

  export = JwksClient;
}