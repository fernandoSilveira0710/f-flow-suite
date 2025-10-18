import { JSONSchemaType } from 'ajv';

export type PaymentMethodType = 'CASH' | 'DEBIT' | 'CREDIT' | 'PIX' | 'VOUCHER' | 'OTHER';

export interface PaymentMethodUpsertedEventPayload {
  id: string;
  nome: string;
  tipo: PaymentMethodType;
  ativo: boolean;
  ordem?: number;
  permiteTroco?: boolean;
  permiteParcelas?: boolean;
  maxParcelas?: number | null;
  jurosPorParcelaPct?: number | null;
  descontoFixoPct?: number | null;
  taxaFixa?: number | null;
  integracao?: {
    provider?: 'nenhum' | 'maquininha' | 'gateway';
    referenciaExterna?: string;
    imprimeComprovante?: boolean;
  } | null;
  regrasCaixa?: {
    contabilizaNoCaixa?: boolean;
    permiteSangria?: boolean;
  } | null;
  restricoes?: {
    valorMin?: number | null;
    valorMax?: number | null;
    somenteSeCaixaAberto?: boolean;
  } | null;
  visibilidade?: {
    mostrarNoPDV?: boolean;
    visivelSomenteParaRoles?: string[] | null;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentMethodDeletedEventPayload {
  id: string;
  deletedAt: string;
}

export const paymentMethodUpsertedEventSchema: JSONSchemaType<PaymentMethodUpsertedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    nome: { type: 'string' },
    tipo: { type: 'string' },
    ativo: { type: 'boolean' },
    ordem: { type: 'number', minimum: 0, nullable: true },
    permiteTroco: { type: 'boolean', nullable: true },
    permiteParcelas: { type: 'boolean', nullable: true },
    maxParcelas: { type: 'number', minimum: 1, nullable: true },
    jurosPorParcelaPct: { type: 'number', minimum: 0, nullable: true },
    descontoFixoPct: { type: 'number', minimum: 0, nullable: true },
    taxaFixa: { type: 'number', minimum: 0, nullable: true },
    integracao: {
      type: 'object',
      properties: {
        provider: { type: 'string', nullable: true },
        referenciaExterna: { type: 'string', nullable: true },
        imprimeComprovante: { type: 'boolean', nullable: true },
      },
      required: [],
      additionalProperties: false,
      nullable: true,
    },
    regrasCaixa: {
      type: 'object',
      properties: {
        contabilizaNoCaixa: { type: 'boolean', nullable: true },
        permiteSangria: { type: 'boolean', nullable: true },
      },
      required: [],
      additionalProperties: false,
      nullable: true,
    },
    restricoes: {
      type: 'object',
      properties: {
        valorMin: { type: 'number', minimum: 0, nullable: true },
        valorMax: { type: 'number', minimum: 0, nullable: true },
        somenteSeCaixaAberto: { type: 'boolean', nullable: true },
      },
      required: [],
      additionalProperties: false,
      nullable: true,
    },
    visibilidade: {
      type: 'object',
      properties: {
        mostrarNoPDV: { type: 'boolean', nullable: true },
        visivelSomenteParaRoles: {
          type: 'array',
          items: { type: 'string' },
          nullable: true,
        },
      },
      required: [],
      additionalProperties: false,
      nullable: true,
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'nome', 'tipo', 'ativo', 'createdAt'],
  additionalProperties: false,
};

export const paymentMethodDeletedEventSchema: JSONSchemaType<PaymentMethodDeletedEventPayload> = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    deletedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'deletedAt'],
  additionalProperties: false,
};