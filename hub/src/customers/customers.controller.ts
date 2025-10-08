import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto } from './dto';

@Controller('tenants/:tenantId/customers')
@UseGuards(OidcGuard, LicenseGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(tenantId, createCustomerDto);
  }

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

  @Patch(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(tenantId, id, updateCustomerDto);
  }

  @Delete(':id')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.customersService.remove(tenantId, id);
  }
}