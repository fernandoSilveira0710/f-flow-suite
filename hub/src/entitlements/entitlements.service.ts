import { Injectable } from '@nestjs/common';

export interface EntitlementsPayload {
  [feature: string]: boolean | number | string | Record<string, unknown>;
}

@Injectable()
export class EntitlementsService {
  async getEntitlements(tenantId: string): Promise<EntitlementsPayload> {
    return {
      pdv: true,
      grooming: false,
      seatLimit: 1,
      tenantId,
    };
  }
}
