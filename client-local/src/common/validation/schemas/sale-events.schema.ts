import { JSONSchemaType } from 'ajv';

export interface SaleCreatedEventPayload {
  id: string;
  code: string;
  operator: string;
  paymentMethod: string;
  total: number;
  customerId?: string;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export const saleCreatedEventSchema: JSONSchemaType<SaleCreatedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string' },
    operator: { type: 'string' },
    paymentMethod: { type: 'string' },
    total: { type: 'number', minimum: 0 },
    customerId: { type: 'string', format: 'uuid', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          qty: { type: 'number', minimum: 1 },
          unitPrice: { type: 'number', minimum: 0 },
          subtotal: { type: 'number', minimum: 0 },
        },
        required: ['id', 'productId', 'qty', 'unitPrice', 'subtotal'],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ['id', 'code', 'operator', 'paymentMethod', 'total', 'createdAt', 'items'],
  additionalProperties: false,
};