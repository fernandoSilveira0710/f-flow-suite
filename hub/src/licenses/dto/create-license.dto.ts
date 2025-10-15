import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';

export enum PlanType {
  STARTER = 'starter',
  PRO = 'pro',
  MAX = 'max'
}

export class CreateLicenseDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  cpf: string;

  @IsEnum(PlanType)
  planKey: PlanType;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class ActivateLicenseDto {
  @IsString()
  tenantId: string;

  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  licenseKey?: string;
}

export class ValidateLicenseDto {
  @IsOptional()
  @IsString()
  licenseKey?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}