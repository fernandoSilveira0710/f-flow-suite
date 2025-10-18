import { IsString, IsOptional, IsDecimal, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsString()
  productId!: string;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  qty!: number;

  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  unitPrice!: number;

  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  subtotal!: number;
}

export class CreateSaleDto {
  @IsString()
  code!: string;

  @IsString()
  operator!: string;

  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  status?: string = 'completed';

  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  total!: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];
}