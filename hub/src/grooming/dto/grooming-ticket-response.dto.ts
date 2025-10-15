import { ApiProperty } from '@nestjs/swagger';

export class GroomingItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketId: string;

  @ApiProperty({ required: false })
  serviceId?: string | null;

  @ApiProperty({ required: false })
  productId?: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty({ required: false })
  service?: {
    id: string;
    name: string;
    price: number;
  } | null;

  @ApiProperty({ required: false })
  product?: {
    id: string;
    name: string;
    price: number;
  } | null;
}

export class GroomingTicketResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  petId: string;

  @ApiProperty()
  tutorId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty({ required: false })
  notes?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: [GroomingItemResponse] })
  items: GroomingItemResponse[];

  @ApiProperty({ required: false })
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
  } | null;

  @ApiProperty({ required: false })
  tutor?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}