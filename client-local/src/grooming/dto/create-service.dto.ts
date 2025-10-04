import { IsString, IsOptional, IsDecimal, IsInt, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  duration: number; // in minutes

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}