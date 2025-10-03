import { JSONSchemaType } from 'ajv';

export interface InventoryAdjustedEventPayload {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  delta: number;
  reason: string;
  previousStock: number;
  newStock: number;
  adjustedAt: string;
}

export const inventoryAdjustedEventSchema: JSONSchemaType<InventoryAdjustedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    productId: { type: 'string', format: 'uuid' },
    productName: { type: 'string', minLength: 1, maxLength: 255 },
    productSku: { type: 'string', minLength: 1, maxLength: 100 },
    delta: { type: 'integer' },
    reason: { type: 'string', minLength: 1, maxLength: 255 },
    previousStock: { type: 'integer', minimum: 0 },
    newStock: { type: 'integer', minimum: 0 },
    adjustedAt: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'productId',
    'productName',
    'productSku',
    'delta',
    'reason',
    'previousStock',
    'newStock',
    'adjustedAt',
  ],
  additionalProperties: false,
};