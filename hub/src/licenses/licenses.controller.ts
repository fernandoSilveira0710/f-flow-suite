import { Controller, Post, Param } from '@nestjs/common';
import { LicensesService } from './licenses.service.js';

@Controller('tenants/:tenantId/licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('issue')
  issue(@Param('tenantId') tenantId: string) {
    return this.licensesService.issueLicense(tenantId);
  }
}
