import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalResponseDto } from './dto';

@Controller('tenants/:tenantId/professionals')
@UseGuards(OidcGuard, LicenseGuard)
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  async findAll(@Param('tenantId') tenantId: string): Promise<ProfessionalResponseDto[]> {
    return this.professionalsService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.findOneByTenant(tenantId, id);
  }
}