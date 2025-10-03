import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { CustomersService } from './customers.service';
import { CustomerResponseDto } from './dto';

@Controller('tenants/:tenantId/customers')
@UseGuards(OidcGuard, LicenseGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Param('tenantId') tenantId: string): Promise<CustomerResponseDto[]> {
    return this.customersService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOneByTenant(tenantId, id);
  }
}