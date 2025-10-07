import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as jose from 'jose';

@Injectable()
export class LicensesService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(tenantId: string, deviceId: string) {
    const license = await this.prisma.license.findFirst({
      where: { tenantId },
    });

    if (!license) {
      throw new Error('LICENSE_NOT_FOUND');
    }

    const entitlements = await this.prisma.entitlement.findMany({
      where: { planKey: license.planKey },
    });

    const payload = {
      tid: tenantId,
      did: deviceId,
      plan: license.planKey,
      ent: entitlements.reduce<Record<string, unknown>>((acc, ent) => {
        acc[ent.key] = ent.value;
        return acc;
      }, {}),
      exp: Math.floor(new Date(license.expiry).getTime() / 1000),
      grace: license.graceDays,
      iat: Math.floor(Date.now() / 1000),
      iss: '2f-hub',
    };

    const privateKeyPem = process.env.LICENSE_PRIVATE_KEY_PEM;
    if (!privateKeyPem) {
      throw new Error('MISSING_LICENSE_PRIVATE_KEY_PEM');
    }

    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: 'license-key' })
      .setExpirationTime(payload.exp)
      .sign(privateKey);

    return token;
  }
}
