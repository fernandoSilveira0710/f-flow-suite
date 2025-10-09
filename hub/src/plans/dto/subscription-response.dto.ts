import { PlanResponseDto } from './plan-response.dto';

export class SubscriptionResponseDto {
  id: string;
  tenantId: string;
  planId: string;
  plan?: PlanResponseDto;
  status: string;
  startAt: Date;
  expiresAt?: Date;
  canceledAt?: Date;
  paymentData?: Record<string, any>;
  billingCycle: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}