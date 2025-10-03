import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleItemDto } from './sale-item.dto';

export class CreateSaleDto {
  @IsString()
  operator: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}