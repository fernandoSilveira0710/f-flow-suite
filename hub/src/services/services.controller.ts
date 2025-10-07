import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { ServicesService } from './services.service';
import { ServiceResponseDto } from './dto';

@Controller('tenants/:tenantId/services')
@UseGuards(OidcGuard, LicenseGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(@Param('tenantId') tenantId: string): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.findOneByTenant(tenantId, id);
  }
}