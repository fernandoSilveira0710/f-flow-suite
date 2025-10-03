import { JSONSchemaType } from 'ajv';

export interface CustomerUpsertedEventPayload {
  id: string;
  name: string;
  documento?: string;
  email?: string;
  phone?: string;
  dataNascISO?: string;
  tags?: string;
  notes?: string;
  address?: string;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerDeletedEventPayload {
  id: string;
  deletedAt: string;
}

export const customerUpsertedEventSchema: JSONSchemaType<CustomerUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    documento: { type: 'string', nullable: true },
    email: { type: 'string', format: 'email', nullable: true },
    phone: { type: 'string', nullable: true },
    dataNascISO: { type: 'string', format: 'date-time', nullable: true },
    tags: { type: 'string', nullable: true },
    notes: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    active: { type: 'boolean', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'createdAt'],
  additionalProperties: false,
};

export const customerDeletedEventSchema: JSONSchemaType<CustomerDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'deletedAt'],
  additionalProperties: false,
};