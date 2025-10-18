export class InventoryLevelDto {
  productId: string;
  productName: string;
  currentStock: number;
  lastUpdated: Date;
}

export class InventoryAdjustmentResponseDto {
  id: string;
  productId: string;
  delta: number;
  reason: string;
  notes?: string;
  document?: string;
  unitCost?: number;
  createdAt: Date;
}

export class AdjustInventoryResponseDto {
  adjustments: InventoryAdjustmentResponseDto[];
  message: string;
}