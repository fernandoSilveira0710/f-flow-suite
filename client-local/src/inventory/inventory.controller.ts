import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  AdjustInventoryDto,
  InventoryLevelDto,
  AdjustInventoryResponseDto,
  InventoryAdjustmentResponseDto,
} from './dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  async adjustInventory(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidUnknownValues: true })) adjustInventoryDto: AdjustInventoryDto,
  ): Promise<AdjustInventoryResponseDto> {
    return this.inventoryService.adjustInventory(adjustInventoryDto);
  }

  @Get(':productId')
  async getInventoryLevel(
    @Param('productId') productId: string,
  ): Promise<InventoryLevelDto> {
    return this.inventoryService.getInventoryLevel(productId);
  }

  @Get()
  async getAllInventoryLevels(): Promise<InventoryLevelDto[]> {
    return this.inventoryService.getAllInventoryLevels();
  }

  // Listar ajustes de inventário (todos)
  @Get('adjustments')
  async getAllAdjustments(): Promise<InventoryAdjustmentResponseDto[]> {
    return this.inventoryService.getAllAdjustments();
  }

  // Listar ajustes de inventário por produto
  @Get('adjustments/product/:productId')
  async getAdjustmentsByProduct(
    @Param('productId') productId: string,
  ): Promise<InventoryAdjustmentResponseDto[]> {
    return this.inventoryService.getAdjustmentsByProduct(productId);
  }
}