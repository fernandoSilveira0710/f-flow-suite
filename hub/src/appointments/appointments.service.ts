import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentResponseDto } from './dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createAppointmentDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    // Validate schedule conflicts
    await this.validateScheduleConflict(
      tenantId,
      createAppointmentDto.professionalId,
      new Date(createAppointmentDto.startTime),
      new Date(createAppointmentDto.endTime)
    );

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        petId: createAppointmentDto.petId,
        customerId: createAppointmentDto.customerId,
        serviceId: createAppointmentDto.serviceId,
        professionalId: createAppointmentDto.professionalId,
        date: new Date(createAppointmentDto.date),
        startTime: new Date(createAppointmentDto.startTime),
        endTime: new Date(createAppointmentDto.endTime),
        status: createAppointmentDto.status || 'scheduled',
        notes: createAppointmentDto.notes,
        price: createAppointmentDto.price,
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Generate sync event
    await this.generateAppointmentEvent('appointment.created.v1', appointment);

    return appointment;
  }

  async findAll(tenantId: string, status?: string, professionalId?: string, date?: string): Promise<AppointmentResponseDto[]> {
    const where: any = { tenantId };
    
    if (status) {
      where.status = status;
    }
    
    if (professionalId) {
      where.professionalId = professionalId;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findOne(tenantId: string, id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(tenantId: string, id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<AppointmentResponseDto> {
    // Check if appointment exists
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existingAppointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Validate schedule conflicts if time or professional is being changed
    if (updateAppointmentDto.startTime || updateAppointmentDto.endTime || updateAppointmentDto.professionalId) {
      const startTime = updateAppointmentDto.startTime 
        ? new Date(updateAppointmentDto.startTime) 
        : existingAppointment.startTime;
      const endTime = updateAppointmentDto.endTime 
        ? new Date(updateAppointmentDto.endTime) 
        : existingAppointment.endTime;
      const professionalId = updateAppointmentDto.professionalId || existingAppointment.professionalId;

      await this.validateScheduleConflict(tenantId, professionalId, startTime, endTime, id);
    }

    const appointment = await this.prisma.appointment.update({
      where: { id, tenantId },
      data: {
        ...(updateAppointmentDto.petId && { petId: updateAppointmentDto.petId }),
        ...(updateAppointmentDto.customerId && { customerId: updateAppointmentDto.customerId }),
        ...(updateAppointmentDto.serviceId && { serviceId: updateAppointmentDto.serviceId }),
        ...(updateAppointmentDto.professionalId && { professionalId: updateAppointmentDto.professionalId }),
        ...(updateAppointmentDto.date && { date: new Date(updateAppointmentDto.date) }),
        ...(updateAppointmentDto.startTime && { startTime: new Date(updateAppointmentDto.startTime) }),
        ...(updateAppointmentDto.endTime && { endTime: new Date(updateAppointmentDto.endTime) }),
        ...(updateAppointmentDto.status && { status: updateAppointmentDto.status }),
        ...(updateAppointmentDto.notes !== undefined && { notes: updateAppointmentDto.notes }),
        ...(updateAppointmentDto.price !== undefined && { price: updateAppointmentDto.price }),
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Generate sync event
    await this.generateAppointmentEvent('appointment.updated.v1', appointment);

    return appointment;
  }

  async remove(tenantId: string, id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    await this.prisma.appointment.delete({
      where: { id, tenantId },
    });

    // Generate sync event
    await this.generateAppointmentEvent('appointment.deleted.v1', appointment);

    return appointment;
  }

  private async validateScheduleConflict(
    tenantId: string,
    professionalId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<void> {
    const conflictingAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId,
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        status: {
          notIn: ['cancelled', 'no_show'], // Don't consider cancelled or no-show appointments
        },
        OR: [
          // New appointment starts during existing appointment
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          // New appointment ends during existing appointment
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          // New appointment completely contains existing appointment
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
          // Existing appointment completely contains new appointment
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointments.length > 0) {
      throw new ConflictException(
        `Schedule conflict detected. Professional already has an appointment during this time period.`
      );
    }
  }

  private async generateAppointmentEvent(eventType: string, appointment: any): Promise<void> {
    const payload = {
      id: appointment.id,
      tenantId: appointment.tenantId,
      petId: appointment.petId,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      professionalId: appointment.professionalId,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      price: appointment.price,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };

    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(payload),
      },
    });
  }
}