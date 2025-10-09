import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type LicenseJwtPayload = {
  tid: string; // tenant_id
  did?: string; // device_id
  plan: string; // plan name
  planId?: string; // plan UUID
  ent: Record<string, unknown>; // entitlements/features
  maxSeats: number;
  maxDevices: number;
  exp?: number;
  grace?: number;
  iat?: number;
  iss?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.LICENSE_PUBLIC_KEY_PEM ?? 'replace-me',
      algorithms: ['RS256', 'RS512', 'ES256'],
      ignoreExpiration: false,
    });
  }

  validate(payload: LicenseJwtPayload) {
    return payload;
  }
}
