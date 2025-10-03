import { JSONSchemaType } from 'ajv';

export interface ProductUpsertedEventPayload {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface ProductDeletedEventPayload {
  id: string;
  deletedAt: string;
}

export const productUpsertedEventSchema: JSONSchemaType<ProductUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    price: { type: 'number', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'price', 'createdAt'],
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