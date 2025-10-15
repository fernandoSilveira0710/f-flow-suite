import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PlansService } from '../plans/plans.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
    private readonly jwtService: JwtService,
  ) {}

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
          name: user.tenant.name,
          slug: user.tenant.slug,
        },
      },
    };
  }

  async getPlans() {
    return this.plansService.findAllPlans(true); // Only active plans for public endpoint
  }
}