import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type LicenseJwtPayload = {
  tenant_id: string;
  plan_id: string;
  entitlements: Record<string, unknown>;
  max_seats: number;
  device_id?: string;
  exp?: number;
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
