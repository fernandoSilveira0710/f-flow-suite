import { JSONSchemaType } from 'ajv';

export interface ProfessionalUpsertedEventPayload {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  specialty?: string;
  services?: string[];
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfessionalDeletedEventPayload {
  id: string;
  deletedAt: string;
}

export const professionalUpsertedEventSchema: JSONSchemaType<ProfessionalUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email', nullable: true },
    phone: { type: 'string', nullable: true },
    document: { type: 'string', nullable: true },
    specialty: { type: 'string', nullable: true },
    services: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    active: { type: 'boolean', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'name', 'createdAt'],
  additionalProperties: false,
};

export const professionalDeletedEventSchema: JSONSchemaType<ProfessionalDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'deletedAt'],
  additionalProperties: false,
};