import { Body, Controller, HttpException, HttpStatus, Logger, Post, Headers } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('maintenance')
export class MaintenanceController {
  private readonly logger = new Logger(MaintenanceController.name);

  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('migrate')
  async migrate(@Headers('x-admin-token') adminToken?: string) {
    const expected = process.env.MAINTENANCE_TOKEN;
    if (!expected) {
      throw new HttpException('Maintenance endpoint disabled', HttpStatus.NOT_FOUND);
    }
    if (!adminToken || adminToken !== expected) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      await this.maintenanceService.runMigrations();
      return { ok: true };
    } catch (e: any) {
      this.logger.error('Failed to run migrations via endpoint', e);
      throw new HttpException(e?.message || 'Migration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset-database')
  async resetDatabase(@Body() body: { email?: string; pin?: string }) {
    const email = String(body?.email || '').trim().toLowerCase();
    const pin = String(body?.pin || '').replace(/\D/g, '');
    if (!email) {
      throw new HttpException('Email obrigatório', HttpStatus.BAD_REQUEST);
    }
    if (pin.length !== 4) {
      throw new HttpException('PIN inválido. Informe 4 dígitos.', HttpStatus.BAD_REQUEST);
    }

    const auth = await this.authService.authenticateOfflineByPin(email, pin);
    if (!auth.success || !auth.user) {
      throw new HttpException(auth.message || 'PIN inválido', HttpStatus.UNAUTHORIZED);
    }
    const roleValue = String(auth.user.role || '').trim();
    const roleLower = roleValue.toLowerCase();
    if (roleLower !== 'admin') {
      const roleRecord = (await this.prisma.role.findUnique({ where: { id: roleValue } })) ?? (await this.prisma.role.findUnique({ where: { name: roleValue } }));
      const roleNameLower = String(roleRecord?.name || '').trim().toLowerCase();
      if (roleNameLower !== 'admin') {
      throw new HttpException('Acesso restrito: apenas admin.', HttpStatus.FORBIDDEN);
      }
    }

    try {
      const result = await this.maintenanceService.resetDatabase();
      setTimeout(() => process.exit(0), 250);
      return { ok: true, ...result };
    } catch (e: any) {
      this.logger.error('Failed to reset database via endpoint', e);
      throw new HttpException(e?.message || 'Reset failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
