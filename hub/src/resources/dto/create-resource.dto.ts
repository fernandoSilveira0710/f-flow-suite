import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string; // equipment, room, tool, etc.

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}