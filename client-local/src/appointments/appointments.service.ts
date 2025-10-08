import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { ResourcesService } from '../resources/resources.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private eventValidator: EventValidatorService,
    private resourcesService: ResourcesService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Check resource availability if resourceId is provided
    if (createAppointmentDto.resourceId) {
      const isAvailable = await this.resourcesService.checkResourceAvailability(
        createAppointmentDto.resourceId,
        new Date(createAppointmentDto.date),
        createAppointmentDto.startTime,
        createAppointmentDto.endTime
      );
      
      if (!isAvailable) {
        throw new Error('Resource is not available at the specified time');
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        customerId: createAppointmentDto.customerId,
        petId: createAppointmentDto.petId,
        serviceId: createAppointmentDto.serviceId,
        professionalId: createAppointmentDto.professionalId,
        resourceId: createAppointmentDto.resourceId,
        serviceType: 'grooming', // default value since it's required but not in DTO
        date: new Date(createAppointmentDto.date),
        startTime: createAppointmentDto.startTime,
        endTime: createAppointmentDto.endTime,
        duration: createAppointmentDto.duration,
        status: createAppointmentDto.status,
        notes: createAppointmentDto.notes,
        price: createAppointmentDto.price,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        professional: true,
        resource: true,
      },
    });

    // Generate sync event
    await this.generateAppointmentEvent('appointment.created.v1', appointment);

    return appointment;
  }

  async findAll(status?: string) {
    const where = status ? { status } : {};
    
    return this.prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        pet: true,
        service: true,
        professional: true,
        resource: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        pet: true,
        service: true,
        professional: true,
        resource: true,
      },
    });
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    // Check resource availability if resourceId is being updated
    if (updateAppointmentDto.resourceId || updateAppointmentDto.date || updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
      // Get current appointment to check existing values
      const currentAppointment = await this.prisma.appointment.findUnique({
        where: { id }
      });
      
      if (!currentAppointment) {
        throw new Error('Appointment not found');
      }

      const resourceId = updateAppointmentDto.resourceId || currentAppointment.resourceId;
      const date = updateAppointmentDto.date ? new Date(updateAppointmentDto.date) : currentAppointment.date;
      const startTime = updateAppointmentDto.startTime || currentAppointment.startTime;
      const endTime = updateAppointmentDto.endTime || currentAppointment.endTime;

      if (resourceId && startTime && endTime) {
        const isAvailable = await this.resourcesService.checkResourceAvailability(
          resourceId,
          date,
          startTime,
          endTime,
          id // exclude current appointment from conflict check
        );
        
        if (!isAvailable) {
          throw new Error('Resource is not available at the specified time');
        }
      }
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...updateAppointmentDto,
        ...(updateAppointmentDto.date && { date: new Date(updateAppointmentDto.date) }),
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        professional: true,
        resource: true,
      },
    });

    // Generate sync event
    await this.generateAppointmentEvent('appointment.updated.v1', appointment);

    return appointment;
  }

  async remove(id: string) {
    const appointment = await this.prisma.appointment.delete({
      where: { id },
      include: {
        customer: true,
        pet: true,
        service: true,
        professional: true,
        resource: true,
      },
    });

    // Generate sync event
    await this.generateAppointmentEvent('appointment.deleted.v1', appointment);

    return appointment;
  }

  private async generateAppointmentEvent(eventType: string, appointment: any) {
    const payload = {
      id: appointment.id,
      customerId: appointment.customerId,
      petId: appointment.petId,
      serviceId: appointment.serviceId,
      professionalId: appointment.professionalId,
      resourceId: appointment.resourceId,
      serviceType: appointment.serviceType,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      duration: appointment.duration,
      status: appointment.status,
      notes: appointment.notes,
      price: appointment.price,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };

    const validationResult = this.eventValidator.validateEvent(eventType, payload);
    if (!validationResult.valid) {
      console.warn(`Invalid event structure for ${eventType}:`, validationResult.errors);
      return;
    }
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(payload),
      },
    });
  }
}