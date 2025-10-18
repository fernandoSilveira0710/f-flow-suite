import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string = 'BRL';

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxSeats: number = 1;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxDevices: number = 1;

  @IsObject()
  featuresEnabled!: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}