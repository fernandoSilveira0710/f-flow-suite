import { Injectable } from '@nestjs/common';

export interface LicenseTokenPayload {
  tenantId: string;
  planId: string;
  entitlements: Record<string, unknown>;
  maxSeats: number;
  deviceId?: string;
  expiresAt: Date;
}

@Injectable()
export class LicensesService {
  async issueLicense(tenantId: string): Promise<LicenseTokenPayload> {
    return {
      tenantId,
      planId: 'starter',
      entitlements: {},
      maxSeats: 1,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };
  }
}
