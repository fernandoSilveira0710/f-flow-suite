import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  async findAll(tenantId: string, page = 1, limit = 50, search?: string, active?: boolean) {
    const skip = (page - 1) * limit;
    
    const where = {
      tenantId,
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(active !== undefined && { active }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(tenantId: string, createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        tenantId,
        active: createUserDto.active ?? true,
      },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'user.upserted.v1',
      payload: user,
    });

    return user;
  }

  async update(tenantId: string, id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(tenantId, id);

    const user = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: updateUserDto,
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'user.upserted.v1',
      payload: user,
    });

    return user;
  }

  async remove(tenantId: string, id: string) {
    const existingUser = await this.findOne(tenantId, id);

    await this.prisma.user.delete({
      where: { id: existingUser.id },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'user.deleted.v1',
      payload: { id: existingUser.id },
    });

    return { message: 'User deleted successfully' };
  }

  async findByEmail(tenantId: string, email: string) {
    return this.prisma.user.findFirst({
      where: { tenantId, email },
    });
  }

  async findActiveUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, active: true },
      orderBy: { displayName: 'asc' },
    });
  }
}