import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCheckInDto {
  @IsUUID()
  petId: string;

  @IsUUID()
  professionalId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}