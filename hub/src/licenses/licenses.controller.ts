import { Body, Controller, Post } from '@nestjs/common';
import { LicensesService } from './licenses.service';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('activate')
  async activate(@Body() dto: { tenantId: string; deviceId: string }) {
    if (!dto?.tenantId || !dto?.deviceId) {
      return { error: 'tenantId e deviceId são obrigatórios' };
    }

    const licenseToken = await this.licensesService.issue(
      dto.tenantId,
      dto.deviceId
    );

    return { licenseToken };
  }
}
