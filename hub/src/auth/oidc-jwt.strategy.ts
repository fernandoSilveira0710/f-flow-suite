import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { verify } from 'jsonwebtoken';
import NodeCache from 'node-cache';

@Injectable()
export class OidcJwtStrategy extends PassportStrategy(Strategy, 'oidc-jwt') {
  private cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  private jwksClient: any;
  private jwksClientInitialized = false;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request: any, rawJwtToken: string, done: any) => {
        try {
          const key = await this.getSigningKey(rawJwtToken);
          done(null, key);
        } catch (error) {
          done(error, null);
        }
      },
    });
  }

  private async initializeJwksClient() {
    if (this.jwksClientInitialized) {
      return;
    }

    try {
      const jwksClientModule = await import('jwks-client');
      const JwksClient = (jwksClientModule as any).default;

      const jwksUrl = process.env.OIDC_JWKS_URL;
      if (!jwksUrl) {
        throw new Error('OIDC_JWKS_URL environment variable is required');
      }

      this.jwksClient = new JwksClient({
        jwksUri: jwksUrl,
        cache: true,
        cacheMaxAge: 3600000, // 1 hour
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      });

      this.jwksClientInitialized = true;
    } catch (error: any) {
      throw new Error(`Failed to initialize JWKS client: ${error?.message || 'Unknown error'}`);
    }
  }

  private async getSigningKey(token: string): Promise<string> {
    await this.initializeJwksClient();

    const decoded = this.decodeToken(token);
    const kid = decoded.header.kid;

    if (!kid) {
      throw new UnauthorizedException('Token missing kid in header');
    }

    // Check cache first
    const cacheKey = `jwks-key-${kid}`;
    let signingKey = this.cache.get<string>(cacheKey);

    if (!signingKey) {
      try {
        const key = await this.jwksClient.getSigningKey(kid);
        signingKey = key.getPublicKey();
        this.cache.set(cacheKey, signingKey);
      } catch (error: any) {
        throw new UnauthorizedException(`Unable to find signing key: ${error?.message || 'Unknown error'}`);
      }
    }

    if (!signingKey) {
      throw new UnauthorizedException('Unable to retrieve signing key');
    }

    return signingKey;
  }

  private decodeToken(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return { header, payload };
    } catch (error) {
      throw new UnauthorizedException('Invalid token encoding');
    }
  }

  async validate(payload: any) {
    const requiredIssuer = process.env.OIDC_ISSUER;
    const requiredAudience = process.env.OIDC_AUDIENCE;

    // Validate issuer
    if (requiredIssuer && payload.iss !== requiredIssuer) {
      throw new UnauthorizedException(`Invalid issuer. Expected: ${requiredIssuer}, Got: ${payload.iss}`);
    }

    // Validate audience
    if (requiredAudience) {
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audiences.includes(requiredAudience)) {
        throw new UnauthorizedException(`Invalid audience. Expected: ${requiredAudience}, Got: ${audiences.join(', ')}`);
      }
    }

    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Token has expired');
    }

    // Return user info for request.user
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      iss: payload.iss,
      aud: payload.aud,
      exp: payload.exp,
      iat: payload.iat,
    };
  }
}