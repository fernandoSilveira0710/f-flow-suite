import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('tenants/:tenantId/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('events')
  async pushEvents(
    @Param('tenantId') tenantId: string,
    @Body('events') events: any[] = [],
  ) {
    await this.syncService.ingestEvents(tenantId, events);
    return { accepted: events.length };
  }

  @Get('commands')
  async pullCommands(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const commands = await this.syncService.fetchCommands(tenantId, limit ? Number(limit) : undefined);
    return { commands };
  }
}
