import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateResourceTypeDto } from './dto/create-resource-type.dto';
import { UpdateResourceTypeDto } from './dto/update-resource-type.dto';

@Injectable()
export class ResourceTypeService {
  constructor(private prisma: PrismaService) {}

  async create(createResourceTypeDto: CreateResourceTypeDto) {
    return this.prisma.resourceType.create({
      data: createResourceTypeDto,
    });
  }

  async findAll() {
    return this.prisma.resourceType.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const resourceType = await this.prisma.resourceType.findUnique({
      where: { id },
    });

    if (!resourceType) {
      throw new NotFoundException(`ResourceType with ID ${id} not found`);
    }

    return resourceType;
  }

  async update(id: string, updateResourceTypeDto: UpdateResourceTypeDto) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.resourceType.update({
      where: { id },
      data: updateResourceTypeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.resourceType.delete({
      where: { id },
    });
  }
}