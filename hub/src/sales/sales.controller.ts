import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { SaleResponseDto, CreateSaleDto, UpdateSaleDto } from './dto';

@Controller('tenants/:tenantId/sales')
export class SalesController {
  private readonly logger = new Logger(SalesController.name);

  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAllByTenant(
    @Param('tenantId') tenantId: string,
  ): Promise<SaleResponseDto[]> {
    this.logger.log(`GET /tenants/${tenantId}/sales - Fetching all sales for tenant`);
    return this.salesService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findOneByTenant(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<SaleResponseDto> {
    this.logger.log(`GET /tenants/${tenantId}/sales/${id} - Fetching sale by ID for tenant`);
    return this.salesService.findOneByTenant(tenantId, id);
  }

  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() createSaleDto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    this.logger.log(`POST /tenants/${tenantId}/sales - Creating new sale for tenant`);
    return this.salesService.create(tenantId, createSaleDto);
  }

  @Put(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ): Promise<SaleResponseDto> {
    this.logger.log(`PUT /tenants/${tenantId}/sales/${id} - Updating sale for tenant`);
    return this.salesService.update(tenantId, id, updateSaleDto);
  }

  @Delete(':id')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    this.logger.log(`DELETE /tenants/${tenantId}/sales/${id} - Deleting sale for tenant`);
    return this.salesService.remove(tenantId, id);
  }
}