import { Decimal } from '@prisma/client/runtime/library';

export class AppointmentResponseDto {
  id!: string;
  tenantId!: string;
  petId!: string;
  customerId!: string;
  serviceId!: string;
  professionalId!: string;
  resourceId?: string | null;
  resource?: {
    id: string;
    name: string;
    type: string;
  } | null;
  date!: Date;
  startTime!: Date;
  endTime!: Date;
  status!: string;
  notes?: string | null;
  price?: Decimal | null;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
  } | null;
  customer?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    price: number;
    duration?: number | null;
  } | null;
  professional?: {
    id: string;
    name: string;
    role: string;
  } | null;
}