import { JSONSchemaType } from 'ajv';

export interface ResourceUpsertedEventPayload {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResourceDeletedEventPayload {
  id: string;
  tenantId: string;
  deletedAt: string;
}

export const resourceUpsertedEventSchema: JSONSchemaType<ResourceUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'tenantId', 'name', 'type', 'createdAt'],
  additionalProperties: false,
};

export const resourceDeletedEventSchema: JSONSchemaType<ResourceDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string' },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'tenantId', 'deletedAt'],
  additionalProperties: false,
};