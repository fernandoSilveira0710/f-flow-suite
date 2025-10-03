import { JSONSchemaType } from 'ajv';

export interface ProductUpsertedEventPayload {
  id: string;
  sku: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice?: number;
  stockQty: number;
  category?: string;
  barcode?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  trackStock: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDeletedEventPayload {
  id: string;
  sku: string;
  name: string;
  deletedAt: string;
}

export const productUpsertedEventSchema: JSONSchemaType<ProductUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    sku: { type: 'string', minLength: 1, maxLength: 100 },
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', nullable: true, maxLength: 1000 },
    salePrice: { type: 'number', minimum: 0 },
    costPrice: { type: 'number', nullable: true, minimum: 0 },
    stockQty: { type: 'integer', minimum: 0 },
    category: { type: 'string', nullable: true, maxLength: 100 },
    barcode: { type: 'string', nullable: true, maxLength: 100 },
    unit: { type: 'string', nullable: true, maxLength: 50 },
    minStock: { type: 'integer', nullable: true, minimum: 0 },
    maxStock: { type: 'integer', nullable: true, minimum: 0 },
    trackStock: { type: 'boolean' },
    active: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'sku',
    'name',
    'salePrice',
    'stockQty',
    'trackStock',
    'active',
    'createdAt',
    'updatedAt',
  ],
  additionalProperties: false,
};

export const productDeletedEventSchema: JSONSchemaType<ProductDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    sku: { type: 'string', minLength: 1, maxLength: 100 },
    name: { type: 'string', minLength: 1, maxLength: 255 },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'sku', 'name', 'deletedAt'],
  additionalProperties: false,
};