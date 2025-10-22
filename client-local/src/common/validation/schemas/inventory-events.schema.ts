import { JSONSchemaType } from 'ajv';

// Align payload schema with generateInventoryEvent and hub consumer expectations
export interface InventoryAdjustedEventPayload {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  delta: number;
  reason: string;
  previousStock: number;
  newStock: number;
  adjustedAt: string; // ISO date-time
}

export const inventoryAdjustedEventSchema: JSONSchemaType<InventoryAdjustedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    productId: { type: 'string', format: 'uuid' },
    productName: { type: 'string' },
    productSku: { type: 'string', nullable: true },
    delta: { type: 'number' },
    reason: { type: 'string' },
    previousStock: { type: 'number' },
    newStock: { type: 'number' },
    adjustedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'productId', 'productName', 'delta', 'reason', 'previousStock', 'newStock', 'adjustedAt'],
  additionalProperties: false,
};