import { Controller, Post, Get, Body } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async pushEvents(@Body() body: { events: any[] }) {
    const result = await this.syncService.pushOutbox(body.events || []);
    return result;
  }

  @Get('pull')
  async pullCommands() {
    const result = await this.syncService.pullCommands();
    return result;
  }

  @Get('test')
  async testSync() {
    // Test event to push to Hub
    const testEvents = [
      {
        id: '1',
        aggregate: 'sale',
        type: 'sale.created',
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