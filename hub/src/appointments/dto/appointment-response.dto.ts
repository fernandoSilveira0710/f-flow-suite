import { Decimal } from '@prisma/client/runtime/library';

export class AppointmentResponseDto {
  id: string;
  tenantId: string;
  petId: string;
  customerId: string;
  serviceId: string;
  professionalId: string;
  resourceId?: string;
  resource?: {
    id: string;
    name: string;
    type: string;
  };
  date: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string;
  price?: Decimal;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string;
  };
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    price: Decimal;
    duration: number;
  };
  professional?: {
    id: string;
    name: string;
    role: string;
  };
}