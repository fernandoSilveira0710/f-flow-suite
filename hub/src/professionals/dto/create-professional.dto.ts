import { IsString, IsEmail, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[]; // Services this professional can provide

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}