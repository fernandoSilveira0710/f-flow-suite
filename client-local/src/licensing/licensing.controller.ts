import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LicensingService } from './licensing.service';

export interface ActivateResponse {
  success: boolean;
  message: string;
  tenantId?: string;
  deviceId?: string;
  planKey?: string;
  expiresAt?: string;
}

export interface InstallStatusResponse {
  isInstalled: boolean;
  tenantId?: string;
  deviceId?: string;
  hasLicense?: boolean;
  planKey?: string;
  expiresAt?: string;
}

export interface LicenseStatusResponse {
  valid: boolean;
  status: string;
  reason?: string;
  cached?: boolean;
  planKey?: string;
  expiresAt?: Date;
  tenantId?: string;
  showWarning: boolean;
  requiresSetup: boolean;
  canStart: boolean;
}

@Controller('licensing')
export class LicensingController {
  private readonly logger = new Logger(LicensingController.name);

  constructor(
    private readonly licensingService: LicensingService,
    private readonly configService: ConfigService,
  ) {}

  @Post('activate')
  async activate(@Body() body: { tenantId: string; deviceId: string; licenseKey?: string }): Promise<ActivateResponse> {
    try {
      return await this.licensingService.activateLicense(body.tenantId, body.deviceId, body.licenseKey);
    } catch (error: any) {
      this.logger.error('License activation failed', error);
      throw new HttpException(
        `License activation failed: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('install-status')
  async getInstallStatus(@Headers('x-tenant-id') headerTenantId?: string): Promise<InstallStatusResponse> {
    try {
      // Priorizar tenantId do header, fallback para .env
      const tenantId = headerTenantId || this.configService.get<string>('TENANT_ID', 'default-tenant');
      this.logger.log(`Getting install status for tenant: ${tenantId} (source: ${headerTenantId ? 'header' : 'env'})`);
      return await this.licensingService.getInstallStatus();
    } catch (error: any) {
      this.logger.error('Failed to get install status', error);
      throw new HttpException(
        `Failed to get install status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('current')
  async getCurrentLicense() {
    try {
      const license = await this.licensingService.getCurrentLicense();
      if (!license) {
        return { message: 'No active license found' };
      }

      return {
        valid: true,
        status: license.status || 'activated',
        license: {
          tenantId: license.tid,
          deviceId: license.did,
          plan: license.plan,
          entitlements: license.ent,
          expiresAt: new Date(license.exp * 1000).toISOString(),
          graceDays: license.grace
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to get current license', error);
      throw new HttpException(
        `Failed to get current license: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('plan/current')
  async getCurrentPlan() {
    try {
      const license = await this.licensingService.getCurrentLicense();
      if (!license) {
        return { 
          planKey: 'starter',
          message: 'No active license found, defaulting to starter plan'
        };
      }

      // Mapear o plano 'enterprise' (desenvolvimento) para 'max'
      let planKey = license.plan;
      if (planKey === 'enterprise') {
        planKey = 'max';
      }

      // Garantir que o planKey seja válido
      const validPlans = ['starter', 'pro', 'max'];
      if (!validPlans.includes(planKey)) {
        planKey = 'starter';
      }

      return {
        planKey,
        status: license.status || 'activated',
        expiresAt: new Date(license.exp * 1000).toISOString()
      };
    } catch (error: any) {
      this.logger.error('Failed to get current plan', error);
      return { 
        planKey: 'starter',
        message: 'Error getting plan, defaulting to starter'
      };
    }
  }

  @Post('update-cache')
  async updateCache(@Body() updateData: { tenantId: string; planKey: string; lastChecked: string; updatedAt: string }) {
    try {
      this.logger.log(`Updating license cache for tenant ${updateData.tenantId}: ${updateData.planKey}`);
      const result = await this.licensingService.updateLicenseCache(updateData);
      return { success: true, message: 'Cache updated successfully', data: result };
    } catch (error) {
      this.logger.error(`Failed to update cache for tenant ${updateData.tenantId}:`, error);
      throw new HttpException(
        'Failed to update cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate-offline')
  async validateOffline(@Body() body: { tenantId?: string; deviceId?: string }) {
    try {
      const result = await this.licensingService.validateLicenseOffline(body.tenantId, body.deviceId);
      
      return {
        valid: result.valid,
        status: result.status,
        reason: result.reason,
        license: result.license ? {
          tenantId: result.license.tid,
          deviceId: result.license.did,
          plan: result.license.plan,
          entitlements: result.license.ent,
          expiresAt: new Date(result.license.exp * 1000).toISOString(),
          graceDays: result.license.grace
        } : null
      };
    } catch (error: any) {
      this.logger.error('Offline validation failed', error);
      throw new HttpException(
        `Offline validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync-plan')
  async syncPlan(@Body() body: { tenantId: string; planKey: 'starter' | 'pro' | 'max' }) {
    try {
      const success = await this.licensingService.syncPlanWithHub(body.tenantId, body.planKey);
      return { success, message: success ? 'Plan synced successfully' : 'Failed to sync plan' };
    } catch (error: any) {
      this.logger.error('Plan sync failed', error);
      throw new HttpException(
        `Plan sync failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('persist')
  async persistLicense(@Body() body: { 
    tenantId: string; 
    userId: string; 
    licenseData: any 
  }) {
    try {
      // Persistir dados de licença localmente para uso offline futuro
      await this.licensingService.updateLicenseCacheFromHub(body.tenantId);
      
      this.logger.log(`Licença persistida localmente para tenant ${body.tenantId}`);
      
      return {
        success: true,
        message: 'Licença persistida com sucesso para uso offline'
      };
    } catch (error: any) {
      this.logger.error('Falha ao persistir licença', error);
      throw new HttpException(
        `Falha ao persistir licença: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  async getLicenseStatus(@Headers('x-tenant-id') headerTenantId?: string): Promise<LicenseStatusResponse> {
    try {
      // Priorizar tenantId do header, fallback para .env
      const tenantId = headerTenantId || this.configService.get<string>('TENANT_ID', 'default-tenant');
      this.logger.log(`Getting license status for tenant: ${tenantId} (source: ${headerTenantId ? 'header' : 'env'})`);
      const result = await this.licensingService.checkLicenseStatus(tenantId);

      return {
        valid: result.valid,
        status: result.status,
        reason: result.reason,
        cached: result.cached,
        planKey: result.planKey,
        expiresAt: result.expiresAt,
        tenantId: tenantId,
        showWarning: ['not_registered', 'not_licensed', 'offline_grace', 'expired'].includes(result.status),
        requiresSetup: result.status === 'not_configured',
        canStart: ['active', 'development', 'offline_grace'].includes(result.status)
      };
    } catch (error: any) {
      this.logger.error('Failed to get license status', error);
      return {
        valid: false,
        status: 'error',
        reason: error.message || 'Unknown error',
        cached: false,
        showWarning: true,
        requiresSetup: false,
        canStart: false
      };
    }
  }

  /**
   * Exposes the raw license token (JWT) stored locally for authenticated Hub calls.
   */
  @Get('token')
  async getLicenseToken(@Headers('x-tenant-id') headerTenantId?: string) {
    try {
      const tenantId = headerTenantId || this.configService.get<string>('TENANT_ID', 'default-tenant');
      this.logger.log(`Retrieving raw license token for tenant: ${tenantId}`);

      const token = await this.licensingService.getRawLicenseToken(tenantId);
      if (!token) {
        throw new HttpException('No license token found', HttpStatus.NOT_FOUND);
      }

      return { token };
    } catch (error: any) {
      this.logger.error('Failed to retrieve license token', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve license token: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}