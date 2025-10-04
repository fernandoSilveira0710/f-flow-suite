import { JSONSchemaType } from 'ajv';

export interface ServiceUpsertedEventPayload {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  category?: string;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceDeletedEventPayload {
  id: string;
  deletedAt: string;
}

export const serviceUpsertedEventSchema: JSONSchemaType<ServiceUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    price: { type: 'number', minimum: 0 },
    duration: { type: 'number', minimum: 0, nullable: true },
    category: { type: 'string', nullable: true },
    active: { type: 'boolean', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'price', 'createdAt'],
  additionalProperties: false,
};

export const serviceDeletedEventSchema: JSONSchemaType<ServiceDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'deletedAt'],
  additionalProperties: false,
};