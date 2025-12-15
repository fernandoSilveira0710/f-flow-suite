import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PlansService } from '../plans/plans.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../mailer/mailer.service';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
  ) {}

  private readonly logger = new Logger(PublicService.name);

  async registerTenant(registerTenantDto: RegisterTenantDto) {
    const { name, email, password, planId } = registerTenantDto;

    // Check if user already exists (search by email across all tenants)
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant and user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // First, create or get the default organization
      let org = await tx.org.findFirst({
        where: { name: 'Default Organization' },
      });

      if (!org) {
        org = await tx.org.create({
          data: {
            name: 'Default Organization',
          },
        });
      }

      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          orgId: org.id,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          planId: planId || null,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          displayName: name || email.split('@')[0],
          tenantId: tenant.id,
          active: true,
        },
      });

      return { tenant, user };
    });
    // Try to enrich email with plan details
    let planName: string | undefined;
    let planPrice: number | undefined;
    let planCurrency: string | undefined;
    if (planId) {
      try {
        const plan = await this.plansService.findPlanById(planId);
        planName = plan?.name;
        planPrice = plan.price;
        planCurrency = plan.currency || 'BRL';
      } catch (err) {
        const stack = err instanceof Error ? err.stack : undefined;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[PublicService] Não foi possível obter detalhes do plano: ${msg}`, stack);
      }
    }

    // Fire-and-forget welcome email (non-blocking)
    this.logger.log(`[PublicService] Cadastro concluído. Agendando envio de boas-vindas para ${email} (tenantId=${result.tenant.id}).`);
    this.mailer
      .sendWelcomeEmail({
        to: email,
        name: name || email.split('@')[0],
        email,
        tenantId: result.tenant.id,
        planName,
        planPrice,
        planCurrency,
      })
      .then(() => {
        this.logger.log(`[PublicService] Envio de boas-vindas disparado para ${email}.`);
      })
      .catch((err) => {
        const stack = err instanceof Error ? err.stack : undefined;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[PublicService] Falha ao disparar email de boas-vindas: ${msg}`, stack);
      });

    return {
      message: 'Tenant registered successfully',
      tenantId: result.tenant.id,
      userId: result.user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user (search by email across all tenants)
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.slug,
          slug: user.tenant.slug,
        },
      },
    };
  }

  async getPlans() {
    return this.plansService.findAllPlans(true); // Only active plans for public endpoint
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException('Password reset not allowed in current environment');
    }

    const { email, newPassword } = dto;

    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async contact(dto: ContactDto) {
    const { firstName, lastName, email, phone, subject, message } = dto;
    if (!email || !message) {
      throw new BadRequestException('Email e mensagem são obrigatórios');
    }
    const fromName = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;

    this.logger.log(`[PublicService] Recebida mensagem de contato de ${email}${fromName ? ` (${fromName})` : ''}.`);
    // Dispara envio de contato em background para não bloquear a resposta HTTP
    this.mailer
      .sendContactEmail({
        fromName,
        fromEmail: email,
        phone,
        subject,
        message,
      })
      .then(() => this.logger.log(`[PublicService] Email de contato disparado para ${email}.`))
      .catch((err) => {
        const stack = err instanceof Error ? err.stack : undefined;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[PublicService] Falha ao disparar email de contato: ${msg}`, stack);
      });

    return { status: 'ok' };
  }
}
