import { Injectable } from '@nestjs/common';

export interface GroomingTicketItem {
  serviceId: string;
  name: string;
  price: number;
  qty: number;
}

export interface GroomingTicketDto {
  tutorId: string;
  petId: string;
  items: GroomingTicketItem[];
  status?: string;
}

@Injectable()
export class TicketsService {
  async openTicket(dto: GroomingTicketDto) {
    const total = dto.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return {
      id: 'ticket-temp-id',
      status: dto.status ?? 'CHECKIN',
      ...dto,
      total,
    };
  }
}
