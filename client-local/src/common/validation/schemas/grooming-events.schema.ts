export const groomingTicketCreatedV1Schema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    petId: { type: 'string' },
    tutorId: { type: 'string' },
    professionalId: { type: ['string', 'null'] },
    status: { type: 'string' },
    total: { type: ['number', 'null'] },
    notes: { type: ['string', 'null'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ticketId: { type: 'string' },
          serviceId: { type: ['string', 'null'] },
          productId: { type: ['string', 'null'] },
          name: { type: 'string' },
          price: { type: 'number' },
          qty: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'ticketId', 'name', 'price', 'qty', 'createdAt'],
        additionalProperties: false,
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'code', 'petId', 'tutorId', 'status', 'items', 'createdAt', 'updatedAt'],
  additionalProperties: false,
};

export const groomingTicketUpdatedV1Schema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    petId: { type: 'string' },
    tutorId: { type: 'string' },
    professionalId: { type: ['string', 'null'] },
    status: { type: 'string' },
    total: { type: ['number', 'null'] },
    notes: { type: ['string', 'null'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ticketId: { type: 'string' },
          serviceId: { type: ['string', 'null'] },
          productId: { type: ['string', 'null'] },
          name: { type: 'string' },
          price: { type: 'number' },
          qty: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'ticketId', 'name', 'price', 'qty', 'createdAt'],
        additionalProperties: false,
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'code', 'petId', 'tutorId', 'status', 'items', 'createdAt', 'updatedAt'],
  additionalProperties: false,
};

export const groomingEventSchemas = {
  'grooming.ticket.created.v1': groomingTicketCreatedV1Schema,
  'grooming.ticket.updated.v1': groomingTicketUpdatedV1Schema,
};