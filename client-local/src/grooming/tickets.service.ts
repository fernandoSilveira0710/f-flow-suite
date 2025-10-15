import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateGroomingTicketDto } from './dto/create-grooming-ticket.dto';
import { UpdateGroomingTicketDto } from './dto/update-grooming-ticket.dto';
import { CreateGroomingItemDto } from './dto/create-grooming-item.dto';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private eventValidator: EventValidatorService,
  ) {}

  async create(createTicketDto: CreateGroomingTicketDto) {
    const ticket = await this.prisma.$transaction(async (prisma) => {
      // Generate ticket code
      const code = await this.generateTicketCode();

      // Create the ticket
      const newTicket = await prisma.groomingTicket.create({
        data: {
          code,
          petId: createTicketDto.petId,
          tutorId: createTicketDto.tutorId,
          professionalId: createTicketDto.professionalId,
          status: createTicketDto.status || 'aberto',
          notes: createTicketDto.notes,
        },
      });

      // Create the items if provided
      let items: any[] = [];
      if (createTicketDto.items && createTicketDto.items.length > 0) {
        items = await Promise.all(
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

        // Calculate and update total
        const total = items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
        await prisma.groomingTicket.update({
          where: { id: newTicket.id },
          data: { total },
        });
      }

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
        professional: true,
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
        professional: true,
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
          professionalId: updateTicketDto.professionalId,
          notes: updateTicketDto.notes,
          total: updateTicketDto.total,
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

        // Calculate and update total if not explicitly provided
        if (!updateTicketDto.total) {
          const total = items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
          await prisma.groomingTicket.update({
            where: { id },
            data: { total },
          });
        }

        return { ...updatedTicket, items };
      }

      return updatedTicket;
    });

    // Generate event for synchronization
    await this.generateTicketEvent('grooming.ticket.updated.v1', ticket);

    return ticket;
  }

  async addItem(ticketId: string, createItemDto: CreateGroomingItemDto) {
    const existingTicket = await this.findOne(ticketId);

    const result = await this.prisma.$transaction(async (prisma) => {
      // Create the new item
      const newItem = await prisma.groomingItem.create({
        data: {
          ticketId,
          serviceId: createItemDto.serviceId,
          productId: createItemDto.productId,
          name: createItemDto.name,
          price: createItemDto.price,
          qty: createItemDto.qty,
        },
      });

      // Recalculate total
      const allItems = await prisma.groomingItem.findMany({
        where: { ticketId },
      });
      const total = allItems.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);

      // Update ticket total
      const updatedTicket = await prisma.groomingTicket.update({
        where: { id: ticketId },
        data: { total },
      });

      return { ticket: updatedTicket, item: newItem };
    });

    // Generate event for synchronization
    await this.generateTicketEvent('grooming.ticket.updated.v1', result.ticket);

    return result;
  }

  async remove(id: string) {
    const existingTicket = await this.findOne(id);

    const ticket = await this.prisma.groomingTicket.update({
      where: { id },
      data: { status: 'cancelado' },
    });

    // Generate event for synchronization
    await this.generateTicketEvent('grooming.ticket.updated.v1', ticket);

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
      code: ticket.code,
      petId: ticket.petId,
      tutorId: ticket.tutorId,
      professionalId: ticket.professionalId,
      status: ticket.status,
      total: ticket.total,
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
