import { Controller, Post, Get, Body } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly prisma: PrismaService
  ) {}

  @Post('push')
  async pushEvents(@Body() body?: { events?: any[] }) {
    const result = await this.syncService.pushOutbox(body?.events);
    return result;
  }

  @Post('push/pending')
  async pushPendingEvents() {
    const result = await this.syncService.pushOutbox();
    return result;
  }

  @Get('pull')
  async pullCommands() {
    const result = await this.syncService.pullCommands();
    return result;
  }

  @Get('events')
  async getOutboxEvents() {
    const events = await this.prisma.outboxEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return {
      total: events.length,
      events: events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        payload: JSON.parse(event.payload),
        processed: event.processed,
        createdAt: event.createdAt,
        processedAt: event.processedAt
      }))
    };
  }

  @Get('test')
  async testSync() {
    // Test event to push to Hub
    const testEvents = [
      {
        id: '1',
        aggregate: 'sale',
        type: 'sale.created.v1',
        payload: { saleId: '123', amount: 100.50 },
        occurredAt: new Date().toISOString()
      }
    ];

    const pushResult = await this.syncService.pushOutbox(testEvents);
    const pullResult = await this.syncService.pullCommands(10);

    return {
      push: pushResult,
      pull: pullResult
    };
  }
}