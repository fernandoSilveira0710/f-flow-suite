import { IsString, IsOptional, IsDateString, IsObject, IsBoolean } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  tenantId!: string;

  @IsString()
  planId!: string;

  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsObject()
  paymentData?: Record<string, any>;

  @IsOptional()
  @IsString()
  billingCycle?: string = 'MONTHLY';

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean = true;
}