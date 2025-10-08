import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GroomingTicketResponse } from './dto/grooming-ticket-response.dto';

@Injectable()
export class GroomingService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<GroomingTicketResponse[]> {
    const tickets = await this.prisma.groomingTicket.findMany({
      where: { tenantId },
      include: {
        items: {
          include: {
            service: true,
            product: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map(this.mapToResponseDto);
  }

  async findOne(tenantId: string, id: string): Promise<GroomingTicketResponse> {
    const ticket = await this.prisma.groomingTicket.findFirst({
      where: { 
        id,
        tenantId,
      },
      include: {
        items: {
          include: {
            service: true,
            product: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Grooming ticket with ID ${id} not found`);
    }

    return this.mapToResponseDto(ticket);
  }

  async findByStatus(tenantId: string, status: string): Promise<GroomingTicketResponse[]> {
    const tickets = await this.prisma.groomingTicket.findMany({
      where: { 
        tenantId,
        status,
      },
      include: {
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                salePrice: true,
              },
            },
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map(this.mapToResponseDto);
  }

  async findByPet(tenantId: string, petId: string): Promise<GroomingTicketResponse[]> {
    const tickets = await this.prisma.groomingTicket.findMany({
      where: { 
        tenantId,
        petId,
      },
      include: {
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                salePrice: true,
              },
            },
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map(this.mapToResponseDto);
  }

  async upsertTicketFromEvent(tenantId: string, eventPayload: any): Promise<GroomingTicketResponse> {
    // First, upsert the ticket
    const ticket = await this.prisma.groomingTicket.upsert({
      where: { 
        id: eventPayload.id,
      },
      create: {
        id: eventPayload.id,
        tenantId,
        petId: eventPayload.petId,
        tutorId: eventPayload.tutorId,
        professionalId: eventPayload.professionalId,
        code: eventPayload.code,
        status: eventPayload.status,
        total: eventPayload.total,
        notes: eventPayload.notes,
        createdAt: new Date(eventPayload.createdAt),
        updatedAt: new Date(eventPayload.updatedAt),
      },
      update: {
        petId: eventPayload.petId,
        tutorId: eventPayload.tutorId,
        professionalId: eventPayload.professionalId,
        code: eventPayload.code,
        status: eventPayload.status,
        total: eventPayload.total,
        notes: eventPayload.notes,
        updatedAt: new Date(eventPayload.updatedAt),
      },
    });

    // Delete existing items and recreate them
    await this.prisma.groomingItem.deleteMany({
      where: { ticketId: eventPayload.id },
    });

    // Create new items
    if (eventPayload.items && eventPayload.items.length > 0) {
      await this.prisma.groomingItem.createMany({
        data: eventPayload.items.map((item: any) => ({
          id: item.id,
          ticketId: eventPayload.id,
          serviceId: item.serviceId,
          productId: item.productId,
          name: item.name,
          price: item.price,
          qty: item.qty,
          createdAt: new Date(item.createdAt),
        })),
      });
    }

    // Return the complete ticket with items
    return this.findOne(tenantId, eventPayload.id);
  }

  private mapToResponseDto(ticket: any): GroomingTicketResponse {
    return {
      id: ticket.id,
      tenantId: ticket.tenantId,
      petId: ticket.petId,
      tutorId: ticket.tutorId,
      code: ticket.code,
      status: ticket.status,
      totalPrice: Number(ticket.totalPrice),
      notes: ticket.notes,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      items: ticket.items.map((item: any) => ({
        id: item.id,
        ticketId: item.ticketId,
        serviceId: item.serviceId,
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        qty: item.qty,
        subtotal: Number(item.subtotal),
        service: item.service ? {
          id: item.service.id,
          name: item.service.name,
          price: Number(item.service.price),
        } : null,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.salePrice),
        } : null,
      })),
      pet: ticket.pet,
      tutor: ticket.tutor,
    };
  }
}