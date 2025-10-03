import {
  Controller,
  Get,
  Param,
  Logger,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { SaleResponseDto } from './dto';

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
}