import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, Min } from 'class-validator';

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  tutorId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}