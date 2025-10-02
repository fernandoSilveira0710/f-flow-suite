import { Injectable, Logger } from '@nestjs/common';
import { SyncHttpClient } from './http.client';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly http: SyncHttpClient) {}

  async pushOutbox(events: Record<string, unknown>[]) {
    if (events.length === 0) {
      return { accepted: 0 };
    }
    const tenantId = process.env.TENANT_ID ?? 'unknown';
    this.logger.debug(`Sending ${events.length} events to hub for tenant ${tenantId}`);
    return this.http.post(`/tenants/${tenantId}/sync/events`, { events });
  }

  async pullCommands(limit = 100) {
    const tenantId = process.env.TENANT_ID ?? 'unknown';
    this.logger.debug(`Pulling commands from hub for tenant ${tenantId}`);
    return this.http.get(`/tenants/${tenantId}/sync/commands`, { limit });
  }
}
