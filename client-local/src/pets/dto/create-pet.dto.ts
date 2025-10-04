import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, Min } from 'class-validator';

export class CreatePetDto {
  @IsString()
  tutorId: string; // ID do customer (tutor)

  @IsString()
  name: string;

  @IsString()
  species: string; // espécie (dog, cat, etc.)

  @IsOptional()
  @IsString()
  breed?: string; // raça

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number; // peso

  @IsOptional()
  @IsDateString()
  birthDate?: string; // dataNascimento

  @IsOptional()
  @IsString()
  observations?: string; // observações

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}