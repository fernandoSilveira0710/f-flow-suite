import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { InventoryService } from './inventory.service';
import { InventoryAdjustmentResponseDto, InventoryLevelResponseDto } from './dto';

@Controller('tenants/:tenantId/inventory')
@UseGuards(OidcGuard, LicenseGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('adjustments')
  async findAllAdjustments(@Param('tenantId') tenantId: string): Promise<InventoryAdjustmentResponseDto[]> {
    return this.inventoryService.findAllByTenant(tenantId);
  }

  @Get('adjustments/product/:productId')
  async findAdjustmentsByProduct(
    @Param('tenantId') tenantId: string,
    @Param('productId') productId: string,
  ): Promise<InventoryAdjustmentResponseDto[]> {
    return this.inventoryService.findByProduct(tenantId, productId);
  }

  @Get('levels')
  async getInventoryLevels(@Param('tenantId') tenantId: string): Promise<InventoryLevelResponseDto[]> {
    return this.inventoryService.getInventoryLevels(tenantId);
  }
}