import { Controller, Post, Headers, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  private readonly logger = new Logger(MaintenanceController.name);

  constructor(private readonly maintenanceService: MaintenanceService) {}

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
}