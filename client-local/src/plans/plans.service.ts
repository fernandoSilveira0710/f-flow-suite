import { Injectable, Logger } from '@nestjs/common';
import { LicensingService } from '../licensing/licensing.service';
import axios from 'axios';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);
  private readonly hubBaseUrl = process.env.HUB_BASE_URL || process.env.HUB_API_URL || 'http://localhost:8081';

  constructor(private readonly licensingService: LicensingService) {}

  async getTenantSubscription(tenantId: string) {
    try {
      // Primeiro, tenta buscar do Hub se estiver online
      const hubSubscription = await this.fetchSubscriptionFromHub(tenantId);
      if (hubSubscription) {
        this.logger.log(`Subscription fetched from Hub for tenant: ${tenantId}`);
        return hubSubscription;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch subscription from Hub for tenant ${tenantId}:`, (error as any).message);
    }

    // Fallback: busca informações locais da licença
    try {
      const localSubscription = await this.getLocalSubscriptionInfo(tenantId);
      this.logger.log(`Using local subscription info for tenant: ${tenantId}`);
      return localSubscription;
    } catch (error) {
      this.logger.error(`Failed to get local subscription info for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getTenantInvoices(tenantId: string) {
    try {
      // Tenta buscar faturas do Hub se estiver online
      const hubInvoices = await this.fetchInvoicesFromHub(tenantId);
      if (hubInvoices) {
        this.logger.log(`Invoices fetched from Hub for tenant: ${tenantId}`);
        return hubInvoices;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch invoices from Hub for tenant ${tenantId}:`, (error as any).message);
    }

    // Fallback: retorna array vazio quando offline
    this.logger.log(`Returning empty invoices array for offline mode - tenant: ${tenantId}`);
    return [];
  }

  private async fetchSubscriptionFromHub(tenantId: string) {
    try {
      const response = await axios.get(
        `${this.hubBaseUrl}/tenants/${tenantId}/subscription`,
        { 
          timeout: 5000,
          headers: {
            'x-tenant-id': tenantId
          }
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.warn('Hub is not accessible (offline mode)');
        return null;
      }
      throw error;
    }
  }

  private async fetchInvoicesFromHub(tenantId: string) {
    try {
      const response = await axios.get(
        `${this.hubBaseUrl}/tenants/${tenantId}/invoices`,
        { 
          timeout: 5000,
          headers: {
            'x-tenant-id': tenantId
          }
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.warn('Hub is not accessible (offline mode)');
        return null;
      }
      throw error;
    }
  }

  private async getLocalSubscriptionInfo(tenantId: string) {
    // Busca informações da licença local
    const licenseStatus = await this.licensingService.checkLicenseStatus(tenantId);
    
    if (!licenseStatus.valid) {
      return {
        id: 'local-subscription',
        tenantId,
        planKey: licenseStatus.planKey || 'unknown',
        status: 'expired',
        isActive: false,
        expiresAt: licenseStatus.expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        offline: true,
        message: 'Informações obtidas do cache local - Hub indisponível'
      };
    }

    return {
      id: 'local-subscription',
      tenantId,
      planKey: licenseStatus.planKey || 'development',
      status: licenseStatus.status,
      isActive: licenseStatus.valid,
      expiresAt: licenseStatus.expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offline: true,
      message: 'Informações obtidas do cache local - Hub indisponível'
    };
  }

  /**
   * Sincroniza dados de plano (para uso com sincronização automática)
   */
  async syncPlan(syncData: { tenantId: string; userId: string; planKey: string; syncedAt: string }) {
    this.logger.log(`Syncing plan data for tenant ${syncData.tenantId}: ${syncData.planKey}`);
    
    try {
      // Atualizar o cache da licença com o novo planKey
      await this.licensingService.updateLicenseCache({
        tenantId: syncData.tenantId,
        planKey: syncData.planKey,
        lastChecked: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      this.logger.log(`License cache updated for tenant ${syncData.tenantId} with planKey: ${syncData.planKey}`);
      
      // Registrar a sincronização
      this.logger.log(`Plan sync completed for tenant ${syncData.tenantId} - Plan: ${syncData.planKey}`);
      
      return {
        tenantId: syncData.tenantId,
        planKey: syncData.planKey,
        syncedAt: syncData.syncedAt,
        status: 'synchronized'
      };
    } catch (error) {
      this.logger.error(`Failed to sync plan for tenant ${syncData.tenantId}:`, error);
      throw error;
    }
  }
}