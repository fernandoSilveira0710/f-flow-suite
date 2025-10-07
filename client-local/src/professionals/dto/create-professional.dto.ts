import { IsString, IsOptional, IsBoolean, IsEmail, IsArray } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  document?: string; // CPF/CNPJ

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[]; // IDs dos serviços que o profissional pode realizar

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}