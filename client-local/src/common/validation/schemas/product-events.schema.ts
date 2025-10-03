import { JSONSchemaType } from 'ajv';

export interface ProductUpsertedEventPayload {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice?: number;
  category?: string;
  barcode?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  stockQty?: number;
  currentStock?: number; // Alternative field name for stockQty
  trackStock?: boolean;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductDeletedEventPayload {
  id: string;
  deletedAt: string;
}

export const productUpsertedEventSchema: JSONSchemaType<ProductUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    sku: { type: 'string', nullable: true },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    salePrice: { type: 'number', minimum: 0 },
    costPrice: { type: 'number', minimum: 0, nullable: true },
    category: { type: 'string', nullable: true },
    barcode: { type: 'string', nullable: true },
    unit: { type: 'string', nullable: true },
    minStock: { type: 'number', minimum: 0, nullable: true },
    maxStock: { type: 'number', minimum: 0, nullable: true },
    stockQty: { type: 'number', minimum: 0, nullable: true },
    currentStock: { type: 'number', minimum: 0, nullable: true },
    trackStock: { type: 'boolean', nullable: true },
    active: { type: 'boolean', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'salePrice', 'createdAt'],
  additionalProperties: false,
};

export const productDeletedEventSchema: JSONSchemaType<ProductDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'deletedAt'],
  additionalProperties: false,
};