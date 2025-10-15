import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateConfigurationDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsObject()
  value: any;

  @IsString()
  @IsOptional()
  description?: string;
}

// Specific configuration DTOs for type safety
export class ScheduleConfigurationDto {
  defaultInterval: number;
  autoConfirm: boolean;
  allowOverbooking: boolean;
  overbookingLimit: number;
  reminderTime: 'none' | '1h' | '3h' | '24h';
  reminderChannel: 'sms' | 'whatsapp' | 'email';
  maxSimultaneous: number;
}

export class PosConfigurationDto {
  scannerAutoFocus: boolean;
  beepOnScan: boolean;
  allowGeneralDiscount: boolean;
  maxDiscountPercent: number;
  requireOperator: boolean;
  quickFinalize: boolean;
  receiptModel: 'simplified' | 'detailed';
  defaultPrinter?: string;
  defaultCustomerId?: string;
  requireSeller: boolean;
}

export class NotificationsConfigurationDto {
  onScheduleCreated: boolean;
  onGroomingReady: boolean;
  onSaleCompleted: boolean;
  onLowStock: boolean;
  onExpiringSoon: boolean;
  defaultChannel: 'sms' | 'whatsapp' | 'email' | 'push';
}

export class InventoryConfigurationDto {
  defaultMinStock: number;
  blockSaleWithoutStock: boolean;
  allowNegativeStock: boolean;
  expiryAlertDays: number;
  autoDeductIngredients: boolean;
}

export class GroomingConfigurationDto {
  activeColumns: string[];
  notifyOnReady: boolean;
  requireExclusiveResource: boolean;
  durationPP: number;
  durationP: number;
  durationM: number;
  durationG: number;
  durationGG: number;
  includeQrCode: boolean;
}