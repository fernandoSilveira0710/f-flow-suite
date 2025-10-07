import { IsString, IsOptional } from 'class-validator';

export class CheckOutDto {
  @IsOptional()
  @IsString()
  notes?: string;
}