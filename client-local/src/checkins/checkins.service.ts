import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCheckInDto, CheckOutDto, CheckInResponseDto } from './dto';

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService) {}

  async checkIn(createCheckInDto: CreateCheckInDto): Promise<CheckInResponseDto> {
    // Check if pet is already checked in (no checkout time)
    const existingCheckIn = await this.prisma.checkIn.findFirst({
      where: {
        petId: createCheckInDto.petId,
        checkOutAt: null,
      },
    });

    if (existingCheckIn) {
      throw new ConflictException('Pet is already checked in');
    }

    const checkIn = await this.prisma.checkIn.create({
      data: {
        petId: createCheckInDto.petId,
        professionalId: createCheckInDto.professionalId,
        notes: createCheckInDto.notes,
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
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Generate sync event
    await this.generateCheckInEvent('checkin.created.v1', checkIn);

    return checkIn;
  }

  async checkOut(checkInId: string, checkOutDto?: CheckOutDto): Promise<CheckInResponseDto> {
    // Find the check-in record
    const existingCheckIn = await this.prisma.checkIn.findFirst({
      where: {
        id: checkInId,
        checkOutAt: null, // Only allow checkout if not already checked out
      },
    });

    if (!existingCheckIn) {
      throw new NotFoundException('Active check-in not found');
    }

    const checkIn = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        checkOutAt: new Date(),
        ...(checkOutDto?.notes && { notes: checkOutDto.notes }),
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
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Generate sync event
    await this.generateCheckInEvent('checkout.created.v1', checkIn);

    return checkIn;
  }

  async findAll(petId?: string, professionalId?: string, activeOnly?: boolean): Promise<CheckInResponseDto[]> {
    const where: any = {};
    
    if (petId) {
      where.petId = petId;
    }
    
    if (professionalId) {
      where.professionalId = professionalId;
    }
    
    if (activeOnly) {
      where.checkOutAt = null;
    }

    return this.prisma.checkIn.findMany({
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
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { checkInAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<CheckInResponseDto> {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
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

    if (!checkIn) {
      throw new NotFoundException('Check-in not found');
    }

    return checkIn;
  }

  async findActiveCheckInByPet(petId: string): Promise<CheckInResponseDto | null> {
    return this.prisma.checkIn.findFirst({
      where: {
        petId,
        checkOutAt: null,
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
        professional: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  private async generateCheckInEvent(eventType: string, checkIn: any): Promise<void> {
    const payload = {
      id: checkIn.id,
      petId: checkIn.petId,
      professionalId: checkIn.professionalId,
      checkInAt: checkIn.checkInAt,
      checkOutAt: checkIn.checkOutAt,
      notes: checkIn.notes,
    };

    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(payload),
      },
    });
  }
}