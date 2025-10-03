import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwksClient } from 'jwks-client';
import NodeCache from 'node-cache';

type OidcJwtPayload = {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  iat: number;
  [key: string]: any;
};

@Injectable()
export class OidcJwtStrategy extends PassportStrategy(Strategy, 'oidc-jwt') {
  private readonly logger = new Logger(OidcJwtStrategy.name);
  private readonly jwksClient: JwksClient;
  private readonly keyCache = new NodeCache({ stdTTL: 3600 }); // Cache keys for 1 hour
  private readonly requiredIssuer: string;
  private readonly requiredAudience: string;
  private readonly oidcRequired: boolean;

  constructor() {
    const jwksUrl = process.env.OIDC_JWKS_URL;
    const issuer = process.env.OIDC_ISSUER;
    const audience = process.env.OIDC_AUDIENCE;
    const oidcRequired = process.env.OIDC_REQUIRED !== 'false';

    if (oidcRequired && (!jwksUrl || !issuer || !audience)) {
      throw new Error(
        'OIDC configuration missing: OIDC_JWKS_URL, OIDC_ISSUER, and OIDC_AUDIENCE are required when OIDC_REQUIRED=true'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (request: any, rawJwtToken: any, done: any) => {
        try {
          if (!oidcRequired) {
            // If OIDC is not required, skip validation
            return done(null, 'skip-validation');
          }

          const key = await this.getSigningKey(rawJwtToken);
          done(null, key);
        } catch (error) {
          this.logger.error('Error getting signing key:', error);
          done(error);
        }
      },
      algorithms: ['RS256', 'RS512', 'ES256'],
      ignoreExpiration: false,
      passReqToCallback: false,
    });

    this.requiredIssuer = issuer || '';
    this.requiredAudience = audience || '';
    this.oidcRequired = oidcRequired;

    if (jwksUrl) {
      this.jwksClient = new JwksClient({
        jwksUri: jwksUrl,
        cache: true,
        cacheMaxAge: 3600000, // 1 hour
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      });
    }
  }

  private async getSigningKey(token: string): Promise<string> {
    if (!this.jwksClient) {
      throw new Error('JWKS client not initialized');
    }

    // Decode token header to get kid
    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString()
    );
    
    const kid = header.kid;
    if (!kid) {
      throw new Error('Token header missing kid (key ID)');
    }

    // Check cache first
    const cachedKey = this.keyCache.get(kid);
    if (cachedKey) {
      return cachedKey as string;
    }

    // Fetch key from JWKS
    const key = await this.jwksClient.getSigningKey(kid);
    const publicKey = key.getPublicKey();
    
    // Cache the key
    this.keyCache.set(kid, publicKey);
    
    return publicKey;
  }

  async validate(payload: OidcJwtPayload): Promise<OidcJwtPayload> {
    if (!this.oidcRequired) {
      return payload;
    }

    // Validate issuer
    if (payload.iss !== this.requiredIssuer) {
      this.logger.warn(`Invalid issuer: expected ${this.requiredIssuer}, got ${payload.iss}`);
      throw new Error('Invalid token issuer');
    }

    // Validate audience
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(this.requiredAudience)) {
      this.logger.warn(`Invalid audience: expected ${this.requiredAudience}, got ${audiences.join(', ')}`);
      throw new Error('Invalid token audience');
    }

    this.logger.debug(`OIDC token validated for subject: ${payload.sub}`);
    return payload;
  }
}