import { Injectable } from '@nestjs/common';

export interface InventoryAdjustment {
  productId: string;
  delta: number;
  reason?: string;
}

@Injectable()
export class InventoryService {
  async adjustInventory(adjustments: InventoryAdjustment[]) {
    return adjustments.map((item) => ({ ...item, appliedAt: new Date().toISOString() }));
  }
}
