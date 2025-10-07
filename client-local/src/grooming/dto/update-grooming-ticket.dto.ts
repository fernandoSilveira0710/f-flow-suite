import { PartialType } from '@nestjs/mapped-types';
import { CreateGroomingTicketDto } from './create-grooming-ticket.dto';
import { IsOptional, IsString, IsDecimal } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateGroomingTicketDto extends PartialType(CreateGroomingTicketDto) {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  total?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}