import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateLicenseDto, PlanType } from './dto/create-license.dto';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LicensesService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async createLicenseAfterPayment(createLicenseDto: CreateLicenseDto) {
    const { name, email, cpf, planKey, paymentId } = createLicenseDto;

    // Verificar se já existe um tenant com este email
    let tenant = await this.prisma.tenant.findFirst({
      where: { 
        OR: [
          { email },
          { cpf }
        ]
      },
    });

    // Se não existe, criar novo tenant
    if (!tenant) {
      const tenantId = uuidv4();
      tenant = await this.prisma.tenant.create({
        data: {
          id: tenantId,
          name,
          email,
          cpf,
          planId: planKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Atualizar tenant existente com novo plano
      tenant = await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          planId: planKey,
          updatedAt: new Date(),
        },
      });
    }

    // Definir configurações do plano
    const planConfig = {
      starter: { maxSeats: 1, maxDevices: 1 },
      pro: { maxSeats: 5, maxDevices: 3 },
      max: { maxSeats: 15, maxDevices: 10 },
    };

    const config = planConfig[planKey];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 ano de validade

    // Criar ou atualizar licença
    const license = await this.prisma.license.upsert({
      where: { tenantId: tenant.id },
      update: {
        planKey,
        status: 'active',
        maxSeats: config.maxSeats,
        expiry: expiryDate,
        graceDays: 7,
        updatedAt: new Date(),
      },
      create: {
        tenantId: tenant.id,
        planKey,
        status: 'active',
        maxSeats: config.maxSeats,
        expiry: expiryDate,
        graceDays: 7,
      },
    });

    // Gerar chave de licença única
    const licenseKey = `FL-${email.split('@')[0].toUpperCase()}-${Date.now().toString().slice(-6)}`;

    return {
      tenantId: tenant.id,
      licenseKey,
      license,
      tenant,
      downloadUrl: 'https://releases.2fsolutions.com/f-flow-suite/latest',
      expiresAt: expiryDate,
    };
  }

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

    // Ler a chave privada do arquivo diretamente
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(process.cwd(), 'license_private.pem');
    const privateKeyFromFile = fs.readFileSync(keyPath, 'utf8');

    const privateKey = await jose.importPKCS8(privateKeyFromFile, 'RS256');

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: 'license-key' })
      .setExpirationTime(payload.exp)
      .sign(privateKey);

    // Persistir o token no banco de dados
    await this.prisma.licenseToken.upsert({
      where: {
        tenantId_deviceId: {
          tenantId,
          deviceId
        }
      },
      update: {
        token,
        expiresAt: new Date(payload.exp * 1000),
        revokedAt: null
      },
      create: {
        tenantId,
        deviceId,
        token,
        expiresAt: new Date(payload.exp * 1000)
      }
    });

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

  async validateLicense(licenseKey?: string, tenantId?: string, deviceId?: string) {
    try {
      // Se temos licenseKey, validamos o JWT
      if (licenseKey) {
        const publicKeyPem = process.env.LICENSE_PUBLIC_KEY_PEM;
        if (!publicKeyPem) {
          throw new Error('MISSING_LICENSE_PUBLIC_KEY_PEM');
        }

        const publicKey = await jose.importSPKI(publicKeyPem, 'RS256');
        const { payload } = await jose.jwtVerify(licenseKey, publicKey);

        // Verificar se a licença ainda está válida no banco
        const license = await this.prisma.license.findUnique({
          where: { tenantId: payload.tenantId as string },
          include: { tenant: true }
        });

        if (!license || license.status !== 'active') {
          return {
            valid: false,
            reason: 'LICENSE_INACTIVE_OR_NOT_FOUND',
            license: null
          };
        }

        // Verificar expiração
        if (license.expiry && new Date() > license.expiry) {
          return {
            valid: false,
            reason: 'LICENSE_EXPIRED',
            license: license
          };
        }

        return {
          valid: true,
          license: license,
          payload: payload
        };
      }

      // Se temos tenantId, validamos diretamente no banco
      if (tenantId) {
        const license = await this.prisma.license.findUnique({
          where: { tenantId },
          include: { tenant: true }
        });

        if (!license) {
          return {
            valid: false,
            reason: 'LICENSE_NOT_FOUND',
            license: null
          };
        }

        if (license.status !== 'active') {
          return {
            valid: false,
            reason: 'LICENSE_INACTIVE',
            license: license
          };
        }

        // Verificar expiração
        if (license.expiry && new Date() > license.expiry) {
          return {
            valid: false,
            reason: 'LICENSE_EXPIRED',
            license: license
          };
        }

        return {
          valid: true,
          license: license
        };
      }

      return {
        valid: false,
        reason: 'INSUFFICIENT_PARAMETERS',
        license: null
      };

    } catch (error: any) {
      return {
        valid: false,
        reason: error.message || 'VALIDATION_ERROR',
        license: null
      };
    }
  }
}
