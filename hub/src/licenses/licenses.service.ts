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

    // Get active subscription with plan details
    const subscription = await this.prisma.subscription.findFirst({
      where: { 
        tenantId,
        status: 'ACTIVE',
        startAt: { lte: new Date() },
        expiresAt: { gte: new Date() }
      },
      include: {
        plan: true
      }
    });

    // Fallback to legacy entitlements if no active subscription
    const entitlements = await this.prisma.entitlement.findMany({
      where: { planKey: license.planKey },
    });

    const payload = {
      tid: tenantId,
      did: deviceId,
      plan: subscription?.plan?.name || license.planKey,
      planId: subscription?.planId || null,
      ent: subscription?.plan?.featuresEnabled || entitlements.reduce<Record<string, unknown>>((acc, ent) => {
        acc[ent.key] = ent.value;
        return acc;
      }, {}),
      maxSeats: subscription?.plan?.maxSeats || license.maxSeats,
      maxDevices: subscription?.plan?.maxDevices || 1,
      exp: Math.floor(new Date(subscription?.expiresAt || license.expiry).getTime() / 1000),
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

  async updatePlan(tenantId: string, planKey: 'starter' | 'pro' | 'max') {
    // Verificar se o tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND');
    }

    // Definir maxSeats baseado no plano
    const maxSeatsMap = {
      starter: 1,
      pro: 5,
      max: 15,
    };

    // Atualizar o plano no tenant
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { planId: planKey },
    });

    // Atualizar ou criar a licença
    const license = await this.prisma.license.upsert({
      where: { tenantId },
      update: {
        planKey,
        maxSeats: maxSeatsMap[planKey],
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        planKey,
        status: 'active',
        maxSeats: maxSeatsMap[planKey],
        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        graceDays: 7,
      },
    });

    return license;
  }
}
