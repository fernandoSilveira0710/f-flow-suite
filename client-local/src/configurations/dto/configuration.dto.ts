import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateConfigurationDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  category?: string = 'general';

  @IsString()
  @IsIn(['string', 'number', 'boolean', 'json', 'array'])
  @IsOptional()
  type?: string = 'string';

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateConfigurationDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsIn(['string', 'number', 'boolean', 'json', 'array'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;
}