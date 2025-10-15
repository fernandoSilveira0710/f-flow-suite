import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async emit(eventType: string, payload: any): Promise<void> {
    // Basic event emission - can be extended with actual event bus
    this.logger.log(`Event emitted: ${eventType}`);
    this.logger.debug(payload);
  }

  /**
   * Persist an event in the Outbox table with normalized shape.
   * Accepts varying call shapes used across the codebase and normalizes them.
   */
  async createEvent(
    tenantIdOrSlug: string,
    details: {
      type?: string;
      eventType?: string;
      aggregate?: string;
      entityType?: string;
      entityId?: string;
      data?: any;
      payload?: any;
    }
  ): Promise<void> {
    const type = details.type ?? details.eventType;
    if (!type) {
      throw new Error('Event type is required for createEvent');
    }

    const aggregate =
      details.aggregate ??
      details.entityType ??
      (typeof type === 'string' && type.includes('.') ? type.split('.')[0] : 'unknown');

    const payloadData = details.payload ?? details.data ?? { entityId: details.entityId };

    const tenantId = await this.resolveTenantId(tenantIdOrSlug);

    await this.prisma.outboxEvent.create({
      data: {
        tenantId,
        aggregate,
        type,
        payload: JSON.stringify(payloadData),
      },
    });

    this.logger.debug(`OutboxEvent persisted: ${type} for tenant ${tenantId} (${aggregate})`);
  }

  private async resolveTenantId(idOrSlug: string): Promise<string> {
    // Try slug first
    const bySlug = await this.prisma.tenant.findUnique({ where: { slug: idOrSlug } });
    if (bySlug) return bySlug.id;
    // Fallback to id
    const byId = await this.prisma.tenant.findUnique({ where: { id: idOrSlug } });
    return byId?.id ?? idOrSlug;
  }
}