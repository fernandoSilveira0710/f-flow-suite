import { JSONSchemaType } from 'ajv';

export interface PetUpsertedEventPayload {
  id: string;
  tutorId: string;
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  birthDate?: string;
  observations?: string;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PetDeletedEventPayload {
  id: string;
  deletedAt: string;
}

export const petUpsertedEventSchema: JSONSchemaType<PetUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    tutorId: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    species: { type: 'string' },
    breed: { type: 'string', nullable: true },
    weight: { type: 'number', minimum: 0, nullable: true },
    birthDate: { type: 'string', format: 'date-time', nullable: true },
    observations: { type: 'string', nullable: true },
    active: { type: 'boolean', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'tutorId', 'name', 'species', 'createdAt'],
  additionalProperties: false,
};

export const petDeletedEventSchema: JSONSchemaType<PetDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'deletedAt'],
  additionalProperties: false,
};