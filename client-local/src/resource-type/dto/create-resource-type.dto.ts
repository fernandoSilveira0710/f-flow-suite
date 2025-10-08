import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateResourceTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}