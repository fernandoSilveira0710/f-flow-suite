import { IsString, IsNumber, IsPositive } from 'class-validator';

export class SaleItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  qty: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;
}