import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from './create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(
  OmitType(CreateSubscriptionDto, ['tenantId'] as const)
) {}