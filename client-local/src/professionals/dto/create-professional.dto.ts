import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}