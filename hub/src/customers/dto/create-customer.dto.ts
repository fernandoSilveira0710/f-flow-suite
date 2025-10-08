import { IsString, IsOptional, IsEmail, IsBoolean, IsDateString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  documento?: string; // CPF/CNPJ

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dataNascISO?: string; // Data de nascimento

  @IsOptional()
  @IsString()
  tags?: string; // JSON string for tags

  @IsOptional()
  @IsString()
  notes?: string; // Notas/observações

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}