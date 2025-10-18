import { IsString, IsBoolean, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class ResourceUpsertedEventDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  tenantId!: string;

  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  active!: boolean;

  @IsDateString()
  createdAt!: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}