import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SyncService } from '../sync-agent/sync.service';
import { CreateConfigurationDto, UpdateConfigurationDto } from './dto/configuration.dto';

@Injectable()
export class ConfigurationsService {
  private readonly logger = new Logger(ConfigurationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncAgent: SyncService,
  ) {}

  async findAll(category?: string) {
    try {
      this.logger.log(`Finding all configurations with category: ${category}`);
      const where = category ? { category } : {};
      
      const configurations = await this.prisma.configuration.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' },
        ],
      });

      this.logger.log(`Found ${configurations.length} configurations`);
      return {
        data: configurations,
        total: configurations.length,
      };
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(key: string) {
    const configuration = await this.prisma.configuration.findUnique({
      where: { key },
    });

    if (!configuration) {
      throw new NotFoundException(`Configuration with key '${key}' not found`);
    }

    return configuration;
  }

  async create(createConfigurationDto: CreateConfigurationDto) {
    const configuration = await this.prisma.configuration.create({
      data: {
        key: createConfigurationDto.key,
        value: createConfigurationDto.value,
        category: createConfigurationDto.category || 'general',
        type: createConfigurationDto.type || 'string',
        description: createConfigurationDto.description,
      },
    });

    // Generate outbox event for synchronization
    await this.generateConfigurationEvent(configuration, 'configuration.upserted.v1');

    return configuration;
  }

  async update(key: string, updateConfigurationDto: UpdateConfigurationDto) {
    const existingConfiguration = await this.findOne(key);

    const configuration = await this.prisma.configuration.update({
      where: { key },
      data: {
        ...updateConfigurationDto,
        updatedAt: new Date(),
      },
    });

    // Generate outbox event for synchronization
    await this.generateConfigurationEvent(configuration, 'configuration.upserted.v1');

    return configuration;
  }

  async remove(key: string) {
    const configuration = await this.findOne(key);

    await this.prisma.configuration.delete({
      where: { key },
    });

    // Generate outbox event for synchronization
    await this.generateConfigurationEvent(configuration, 'configuration.deleted.v1');

    return { message: `Configuration '${key}' deleted successfully` };
  }

  async getValue(key: string, defaultValue?: any) {
    try {
      const configuration = await this.findOne(key);
      return this.parseValue(configuration.value, configuration.type);
    } catch (error) {
      return defaultValue;
    }
  }

  async setValue(key: string, value: any, category = 'general', type = 'string') {
    const stringValue = this.stringifyValue(value);
    
    const existingConfig = await this.prisma.configuration.findUnique({
      where: { key },
    });

    if (existingConfig) {
      return this.update(key, { value: stringValue });
    } else {
      return this.create({
        key,
        value: stringValue,
        category,
        type,
        description: `Auto-generated configuration for ${key}`,
      });
    }
  }

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'array':
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      default:
        return value;
    }
  }

  private stringifyValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  private async generateConfigurationEvent(configuration: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: configuration.id,
      key: configuration.key,
      value: configuration.value,
      category: configuration.category,
      type: configuration.type,
      description: configuration.description,
      createdAt: configuration.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: configuration.updatedAt?.toISOString(),
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