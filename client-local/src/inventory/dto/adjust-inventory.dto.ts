import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryAdjustmentItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  delta: number; // positive for increase, negative for decrease

  @IsString()
  reason: string;
}

export class AdjustInventoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryAdjustmentItemDto)
  adjustments: InventoryAdjustmentItemDto[];
}