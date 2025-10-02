import { Injectable } from '@nestjs/common';

export interface TenantSummary {
  id: string;
  slug: string;
  planId?: string;
  createdAt: Date;
}

@Injectable()
export class TenantsService {
  async listTenants(): Promise<TenantSummary[]> {
    return [];
  }

  async getTenant(id: string): Promise<TenantSummary | null> {
    return null;
  }
}
