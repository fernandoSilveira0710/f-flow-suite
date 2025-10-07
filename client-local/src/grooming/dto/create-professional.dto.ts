import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  name: string;

  @IsString()
  role: string; // groomer, veterinarian, assistant, etc.

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}