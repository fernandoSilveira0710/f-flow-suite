import { JSONSchemaType } from 'ajv';

export interface InventoryAdjustedEventPayload {
  id: string;
  productId: string;
  adjustment: number;
  reason: string;
  createdAt: string;
}

export const inventoryAdjustedEventSchema: JSONSchemaType<InventoryAdjustedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    productId: { type: 'string', format: 'uuid' },
    adjustment: { type: 'number' },
    reason: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'productId', 'adjustment', 'reason', 'createdAt'],
  additionalProperties: false,
};