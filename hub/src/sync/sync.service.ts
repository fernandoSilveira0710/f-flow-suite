import { Injectable, Logger } from '@nestjs/common';

export interface OutboxEvent {
  id: string;
  aggregate: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  async ingestEvents(tenantId: string, events: OutboxEvent[]): Promise<void> {
    this.logger.debug(`Received ${events.length} events from tenant ${tenantId}`);
  }

  async fetchCommands(tenantId: string, limit = 100): Promise<Record<string, unknown>[]> {
    this.logger.debug(`Pulling commands for tenant ${tenantId}`);
    return [];
  }
}
