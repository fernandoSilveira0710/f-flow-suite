import { Injectable, Logger } from '@nestjs/common';
import { SyncHttpClient } from './http.client';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';

export enum EventStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  SENDING = 'sending',
  SENT = 'sent',
  ERROR = 'error',
  PROCESSED = 'processed'
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly http: SyncHttpClient,
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService
  ) {}

  private getAggregateFromEventType(eventType: string): string {
    // Extract aggregate from event type (e.g., 'sale.created.v1' -> 'sale')
    const parts = eventType.split('.');
    return parts[0] || 'unknown';
  }

  private async updateEventStatus(eventId: string, status: EventStatus, errorMessage?: string) {
    try {
      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: { 
          status,
          updatedAt: new Date()
        }
      });
      this.logger.debug(`Event ${eventId} status updated to: ${status}${errorMessage ? ` with error: ${errorMessage}` : ''}`);
    } catch (updateError) {
      this.logger.error(`Failed to update event ${eventId} status to ${status}`, updateError);
    }
  }

  async pushOutbox(events?: Record<string, unknown>[]) {
    // Check if sync is enabled
    if (process.env.SYNC_ENABLED === 'false') {
      this.logger.debug('Sync is disabled (SYNC_ENABLED=false), skipping push');
      return { accepted: 0, message: 'Sync disabled' };
    }

    let outboxEvents: any[] = [];
    let providedEvents = false;

    // If no events provided, fetch from database
    if (!events) {
      outboxEvents = await this.prisma.outboxEvent.findMany({
        where: { 
          processed: false,
          OR: [
            { status: { in: [EventStatus.PENDING, EventStatus.ERROR] } },
            { status: null } // Handle existing events without status
          ]
        },
        take: 100,
        orderBy: { createdAt: 'asc' }
      });

      if (outboxEvents.length === 0) {
        return { accepted: 0 };
      }
    } else {
      providedEvents = true;
    }

    const eventsToProcess = providedEvents ? events : outboxEvents;
    if (!eventsToProcess || eventsToProcess.length === 0) {
      this.logger.warn('No events to process');
      return { accepted: 0 };
    }

    const tenantId = process.env.TENANT_ID ?? 'unknown';
    this.logger.log(`Processing ${eventsToProcess.length} events for tenant ${tenantId}`);
    
    const validatedEvents: any[] = [];
    const failedEvents: any[] = [];

    // Validate events with Ajv
    for (const event of eventsToProcess) {
      const eventId = providedEvents ? event.id : event.id;
      const eventType = providedEvents ? event.type : event.eventType;
      const payload = providedEvents ? event.payload : JSON.parse(event.payload);

      if (!providedEvents) {
        await this.updateEventStatus(eventId, EventStatus.VALIDATING);
      }

      // Validate payload using Ajv
      const validationResult = this.eventValidator.validateEvent(eventType, payload);
      
      if (!validationResult.valid) {
        const errorMessage = `Validation failed for event ${eventType}: ${validationResult.errors?.join(', ')}`;
        this.logger.error(errorMessage);
        
        if (!providedEvents) {
          await this.updateEventStatus(eventId, EventStatus.ERROR, errorMessage);
        }
        
        failedEvents.push({ eventId, eventType, error: errorMessage });
        continue;
      }

      // Transform to hub format
      const hubEvent = {
        id: eventId,
        aggregate: this.getAggregateFromEventType(eventType),
        type: eventType,
        payload,
        occurredAt: providedEvents ? event.occurredAt : event.createdAt.toISOString()
      };

      validatedEvents.push(hubEvent);
      
      if (!providedEvents) {
        await this.updateEventStatus(eventId, EventStatus.SENDING);
      }
    }

    if (validatedEvents.length === 0) {
      this.logger.warn('No valid events to send after validation');
      return { 
        accepted: 0, 
        failed: failedEvents.length,
        errors: failedEvents 
      };
    }

    try {
      this.logger.log(`Sending ${validatedEvents.length} validated events to hub`);
      const result = await this.http.post(`/tenants/${tenantId}/sync/events`, { 
        events: validatedEvents 
      });
      
      // Mark events as processed if they came from database
      if (!providedEvents) {
        const eventIds = validatedEvents.map(e => e.id as string);
        
        await this.prisma.outboxEvent.updateMany({
          where: { id: { in: eventIds } },
          data: { 
            processed: true,
            processedAt: new Date(),
            status: EventStatus.PROCESSED
          }
        });

        this.logger.log(`Successfully processed ${eventIds.length} events`);
      }
      
      return {
        accepted: (result as any)?.accepted || validatedEvents.length,
        failed: failedEvents.length,
        errors: failedEvents.length > 0 ? failedEvents : undefined
      };
    } catch (error) {
      this.logger.error('Failed to push events to hub', error);
      
      // Update status to error for database events
      if (!providedEvents) {
        const eventIds = validatedEvents.map(e => e.id as string);
        await Promise.all(
          eventIds.map(id => 
            this.updateEventStatus(id, EventStatus.ERROR, (error as Error).message || 'Unknown error')
          )
        );
      }
      
      throw error;
    }
  }

  async pullCommands(limit = 100) {
    // Check if sync is enabled
    if (process.env.SYNC_ENABLED === 'false') {
      this.logger.debug('Sync is disabled (SYNC_ENABLED=false), skipping pull');
      return { commands: [], message: 'Sync disabled' };
    }

    const tenantId = process.env.TENANT_ID ?? 'unknown';
    this.logger.debug(`Pulling commands from hub for tenant ${tenantId}`);
    
    try {
      const result = await this.http.get(`/tenants/${tenantId}/sync/commands`, { limit }) as any;
      this.logger.debug(`Received ${result.commands?.length || 0} commands from hub`);
      return result;
    } catch (error) {
      this.logger.error('Failed to pull commands from hub', error);
      throw error;
    }
  }

  async getEventStatus(eventId: string) {
    try {
      const event = await this.prisma.outboxEvent.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          eventType: true,
          status: true,
          processed: true,
          createdAt: true,
          processedAt: true,
          updatedAt: true
        }
      });

      if (!event) {
        return null;
      }

      return {
        ...event,
        status: event.status || (event.processed ? EventStatus.PROCESSED : EventStatus.PENDING)
      };
    } catch (error) {
      this.logger.error(`Failed to get status for event ${eventId}`, error);
      throw error;
    }
  }

  async getEventsSummary() {
    try {
      const summary = await this.prisma.outboxEvent.groupBy({
        by: ['status'],
        _count: true
      });

      // Also count events without status (legacy)
      const legacyPending = await this.prisma.outboxEvent.count({
        where: { 
          status: null,
          processed: false
        }
      });

      const legacyProcessed = await this.prisma.outboxEvent.count({
        where: { 
          status: null,
          processed: true
        }
      });

      const result = summary.reduce((acc: Record<string, number>, item: { status: string | null; _count: number }) => {
        acc[item.status || 'unknown'] = item._count;
        return acc;
      }, {} as Record<string, number>);

      // Add legacy counts
      if (legacyPending > 0) {
        result[EventStatus.PENDING] = (result[EventStatus.PENDING] || 0) + legacyPending;
      }
      if (legacyProcessed > 0) {
        result[EventStatus.PROCESSED] = (result[EventStatus.PROCESSED] || 0) + legacyProcessed;
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to get events summary', error);
      throw error;
    }
  }
}
