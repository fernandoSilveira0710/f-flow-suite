import { PlanResponseDto } from './plan-response.dto';

export class SubscriptionResponseDto {
  id!: string;
  tenantId!: string;
  planId!: string;
  plan?: PlanResponseDto;
  status!: string;
  startAt!: Date;
  expiresAt?: Date | null;
  canceledAt?: Date | null;
  paymentData?: Record<string, any> | string | null;
  billingCycle!: string;
  autoRenew!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}