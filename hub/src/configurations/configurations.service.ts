import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreateConfigurationDto, UpdateConfigurationDto } from './dto';

@Injectable()
export class ConfigurationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAll(tenantId: string, category?: string) {
    return this.prisma.configuration.findMany({
      where: {
        tenantId,
        ...(category && { category }),
      },
      orderBy: { key: 'asc' },
    });
  }

  async findOne(tenantId: string, key: string) {
    const configuration = await this.prisma.configuration.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
    });

    if (!configuration) {
      throw new NotFoundException(`Configuration with key ${key} not found`);
    }

    return configuration;
  }

  async findByKey(tenantId: string, key: string) {
    return this.prisma.configuration.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
    });
  }

  async create(tenantId: string, createConfigurationDto: CreateConfigurationDto) {
    const configuration = await this.prisma.configuration.create({
      data: {
        tenantId,
        key: createConfigurationDto.key,
        value: JSON.stringify(createConfigurationDto.value),
        category: this.getCategoryFromKey(createConfigurationDto.key),
      },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'configuration.upserted.v1',
      payload: {
        ...configuration,
        value: createConfigurationDto.value,
      },
    });

    return {
      ...configuration,
      value: createConfigurationDto.value,
    };
  }

  async update(tenantId: string, key: string, updateConfigurationDto: UpdateConfigurationDto) {
    const existingConfiguration = await this.findOne(tenantId, key);

    const configuration = await this.prisma.configuration.update({
      where: { id: existingConfiguration.id },
      data: {
        ...(updateConfigurationDto.value && {
          value: JSON.stringify(updateConfigurationDto.value),
        }),
        category: this.getCategoryFromKey(key),
      },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'configuration.upserted.v1',
      payload: {
        ...configuration,
        value: updateConfigurationDto.value || JSON.parse(existingConfiguration.value),
      },
    });

    return {
      ...configuration,
      value: updateConfigurationDto.value || JSON.parse(existingConfiguration.value),
    };
  }

  async upsert(tenantId: string, key: string, value: any) {
    const configuration = await this.prisma.configuration.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
      create: {
        tenantId,
        key,
        value: JSON.stringify(value),
        category: this.getCategoryFromKey(key),
      },
      update: {
        value: JSON.stringify(value),
        category: this.getCategoryFromKey(key),
      },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'configuration.upserted.v1',
      payload: {
        ...configuration,
        value,
      },
    });

    return {
      ...configuration,
      value,
    };
  }

  async remove(tenantId: string, key: string) {
    const existingConfiguration = await this.findOne(tenantId, key);

    await this.prisma.configuration.delete({
      where: { id: existingConfiguration.id },
    });

    // Generate event for synchronization
    await this.eventsService.createEvent(tenantId, {
      type: 'configuration.deleted.v1',
      payload: { key },
    });

    return { message: 'Configuration deleted successfully' };
  }

  private getCategoryFromKey(key: string): string {
    if (key.startsWith('schedule_')) return 'schedule';
    if (key.startsWith('pos_')) return 'pos';
    if (key.startsWith('notifications_')) return 'notifications';
    if (key.startsWith('inventory_')) return 'inventory';
    if (key.startsWith('grooming_')) return 'grooming';
    return 'system';
  }

  // Helper methods for specific configuration types
  async getScheduleSettings(tenantId: string) {
    const config = await this.findByKey(tenantId, 'schedule_settings');
    return config ? JSON.parse(config.value) : null;
  }

  async getPosSettings(tenantId: string) {
    const config = await this.findByKey(tenantId, 'pos_settings');
    return config ? JSON.parse(config.value) : null;
  }

  async getNotificationsSettings(tenantId: string) {
    const config = await this.findByKey(tenantId, 'notifications_settings');
    return config ? JSON.parse(config.value) : null;
  }

  async getInventorySettings(tenantId: string) {
    const config = await this.findByKey(tenantId, 'inventory_settings');
    return config ? JSON.parse(config.value) : null;
  }

  async getGroomingSettings(tenantId: string) {
    const config = await this.findByKey(tenantId, 'grooming_settings');
    return config ? JSON.parse(config.value) : null;
  }
}