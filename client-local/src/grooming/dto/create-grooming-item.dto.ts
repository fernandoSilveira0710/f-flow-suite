import { IsString, IsOptional, IsDecimal, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGroomingItemDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  name: string;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  qty: number = 1;
}