import { IsString, IsArray, IsOptional, IsDecimal, IsInt, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GroomingItemDto {
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

export class CreateGroomingTicketDto {
  @IsString()
  petId: string;

  @IsString()
  tutorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroomingItemDto)
  items: GroomingItemDto[];

  @IsOptional()
  @IsString()
  status?: string = 'pending';

  @IsOptional()
  @IsString()
  notes?: string;
}