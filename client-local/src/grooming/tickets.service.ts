import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateGroomingTicketDto } from './dto/create-grooming-ticket.dto';
import { UpdateGroomingTicketDto } from './dto/update-grooming-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private eventValidator: EventValidatorService,
  ) {}

  async create(createTicketDto: CreateGroomingTicketDto) {
    const totalPrice = createTicketDto.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    const ticket = await this.prisma.$transaction(async (prisma) => {
      // Create the ticket
      const newTicket = await prisma.groomingTicket.create({
        data: {
          petId: createTicketDto.petId,
          tutorId: createTicketDto.tutorId,
          status: createTicketDto.status || 'pending',
        },
      });

      // Create the items
      const items = await Promise.all(
        createTicketDto.items.map((item) =>
          prisma.groomingItem.create({
            data: {
              ticketId: newTicket.id,
              serviceId: item.serviceId,
              productId: item.productId,
              name: item.name,
              price: item.price,
              qty: item.qty,
            },
          })
        )
      );

      return { ...newTicket, items };
    });

    // Generate event for synchronization
    await this.generateTicketEvent('grooming.ticket.created.v1', ticket);

    return ticket;
  }

  async findAll() {
    return this.prisma.groomingTicket.findMany({
      include: {
        items: {
          include: {
            service: true,
            product: true,
          },
        },
        pet: true,
        tutor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.groomingTicket.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: true,
            product: true,
          },
        },
        pet: true,
        tutor: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Grooming ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateGroomingTicketDto) {
    const existingTicket = await this.findOne(id);

    const ticket = await this.prisma.$transaction(async (prisma) => {
      // Update the ticket
      const updatedTicket = await prisma.groomingTicket.update({
        where: { id },
        data: {
          status: updateTicketDto.status,
        },
      });

      // If items are provided, update them
      if (updateTicketDto.items) {
        // Delete existing items
        await prisma.groomingItem.deleteMany({
          where: { ticketId: id },
        });

        // Create new items
        const items = await Promise.all(
          updateTicketDto.items.map((item) =>
            prisma.groomingItem.create({
              data: {
                ticketId: id,
                serviceId: item.serviceId,
                productId: item.productId,
                name: item.name,
                price: item.price,
                qty: item.qty,
              },
            })
          )
        );

        // Calculate total price but don't store it in the ticket
        const totalPrice = updateTicketDto.items.reduce(
          (sum, item) => sum + item.price * item.qty,
          0
        );

        // Return the updated ticket with calculated total
        return { ...updatedTicket, items, totalPrice };
      }

      return updatedTicket;
    });

    // Generate event for synchronization
    await this.generateTicketEvent('grooming.ticket.updated.v1', ticket);

    return ticket;
  }

  async remove(id: string) {
    const existingTicket = await this.findOne(id);

    const ticket = await this.prisma.groomingTicket.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Generate event for synchronization
    await this.generateTicketEvent('grooming.ticket.cancelled.v1', ticket);

    return ticket;
  }

  private async generateTicketCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await this.prisma.groomingTicket.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });

    return `GT${dateStr}${String(count + 1).padStart(3, '0')}`;
  }

  private async generateTicketEvent(eventType: string, ticket: any) {
    const payload = {
      id: ticket.id,
      petId: ticket.petId,
      tutorId: ticket.tutorId,
      code: ticket.code,
      status: ticket.status,
      totalPrice: ticket.totalPrice,
      notes: ticket.notes,
      items: ticket.items || [],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };

    // Validate event structure
    const isValid = await this.eventValidator.validateEvent(eventType, payload);
    if (!isValid) {
      console.warn(`Invalid event structure for ${eventType}:`, payload);
      return;
    }

    // Store in outbox for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(payload),
      },
    });
  }
}
