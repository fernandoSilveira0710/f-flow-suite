import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
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
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(active !== undefined && { active }),
    };

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data: roles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async create(tenantId: string, createRoleDto: CreateRoleDto) {
    const { permissions, ...rest } = createRoleDto;
    const role = await this.prisma.role.create({
      data: {
        ...rest,
        tenantId,
        permissions: JSON.stringify(permissions ?? []),
      },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'role.upserted.v1',
      payload: role,
    });

    return role;
  }

  async update(tenantId: string, id: string, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.findOne(tenantId, id);

    const { permissions, ...rest } = updateRoleDto as Partial<CreateRoleDto>;
    const data: any = { ...rest };
    if (permissions !== undefined) {
      data.permissions = JSON.stringify(permissions);
    }

    const role = await this.prisma.role.update({
      where: { id: existingRole.id },
      data,
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'role.upserted.v1',
      payload: role,
    });

    return role;
  }

  async remove(tenantId: string, id: string) {
    const existingRole = await this.findOne(tenantId, id);

    await this.prisma.role.delete({
      where: { id: existingRole.id },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'role.deleted.v1',
      payload: { id: existingRole.id },
    });

    return { message: 'Role deleted successfully' };
  }

  async findByName(tenantId: string, name: string) {
    return this.prisma.role.findFirst({
      where: { tenantId, name },
    });
  }

  async findActiveRoles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });
  }
}