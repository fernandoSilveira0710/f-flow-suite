import { IsString, IsOptional, IsBoolean, IsDateString, IsDecimal } from 'class-validator';

export class CreatePetDto {
  @IsString()
  tutorId: string;

  @IsString()
  name: string;

  @IsString()
  species: string; // dog, cat, etc.

  @IsOptional()
  @IsString()
  breed?: string; // raça

  @IsOptional()
  @IsDecimal()
  weight?: number; // peso

  @IsOptional()
  @IsDateString()
  birthDate?: string; // dataNascimento

  @IsOptional()
  @IsString()
  observations?: string; // observações

  @IsOptional()
  @IsString()
  gender?: string; // male, female

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}