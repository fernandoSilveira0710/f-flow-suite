import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { SyncService } from '../sync-agent/sync.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private syncService: SyncService,
  ) {}

  async findAll(active?: boolean) {
    const where = active !== undefined ? { active } : {};
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: createUserDto,
      });

      // Generate outbox event for synchronization
      await this.generateUserEvent(user, 'user.upserted.v1');

      return user;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });

      // Generate outbox event for synchronization
      await this.generateUserEvent(user, 'user.upserted.v1');

      return user;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });

      // Generate outbox event for synchronization
      await this.generateUserEvent(user, 'user.deleted.v1');

      return user;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getRoles() {
    return this.prisma.role.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(roleData: { name: string; description?: string; permissions?: string }) {
    try {
      return await this.prisma.role.create({
        data: {
          ...roleData,
          permissions: roleData.permissions || '[]', // Default to empty permissions array
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Role name already exists');
      }
      throw error;
    }
  }

  private async generateUserEvent(user: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };

    // Store event in OutboxEvent table for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(eventPayload),
        processed: false,
      },
    });
  }
}