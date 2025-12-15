export class InventoryAdjustmentResponseDto {
  id!: string;
  tenantId!: string;
  productId!: string;
  productName!: string;
  productSku!: string;
  delta!: number;
  reason!: string;
  previousStock!: number;
  newStock!: number;
  adjustedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export class InventoryLevelResponseDto {
  productId!: string;
  tenantId!: string;
  productName!: string;
  productSku!: string;
  currentStock!: number;
  lastUpdated!: Date;
}