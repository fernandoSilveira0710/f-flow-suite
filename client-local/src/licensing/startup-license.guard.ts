import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LicensingService } from './licensing.service';

@Injectable()
export class StartupLicenseGuard {
  private readonly logger = new Logger(StartupLicenseGuard.name);

  constructor(
    private readonly licensingService: LicensingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verifica a licença na inicialização da aplicação
   * Retorna informações sobre o status da licença para decidir se deve continuar
   */
  async checkStartupLicense(): Promise<{
    canStart: boolean;
    status: string;
    message: string;
    requiresSetup?: boolean;
    showWarning?: boolean;
  }> {
    const licensingEnforced = this.configService.get<string>('LICENSING_ENFORCED', 'false') === 'true';
    
    // Se licenciamento não está enforçado, permite inicialização
    if (!licensingEnforced) {
      this.logger.log('Licensing not enforced - starting in development mode');
      return {
        canStart: true,
        status: 'development',
        message: 'Running in development mode - licensing not enforced'
      };
    }

    try {
      const tenantId = this.configService.get<string>('TENANT_ID');
      
      if (!tenantId) {
        this.logger.warn('No tenant ID configured');
        return {
          canStart: true, // Permite iniciar para configuração
          status: 'not_configured',
          message: 'Tenant ID not configured. Please configure your tenant ID.',
          requiresSetup: true
        };
      }

      // Verifica status da licença usando cache
      const licenseStatus = await this.licensingService.checkLicenseStatus(tenantId);
      
      if (licenseStatus.valid) {
        const source = licenseStatus.cached ? 'cache' : 'Hub';
        this.logger.log(`Valid license found (${licenseStatus.status}) from ${source}`);
        
        // Se está no período de graça, mostra aviso
        if (licenseStatus.status === 'offline_grace') {
          return {
            canStart: true,
            status: licenseStatus.status,
            message: `License expired but within grace period. Expires: ${licenseStatus.expiresAt?.toLocaleDateString()}`,
            showWarning: true
          };
        }
        
        return {
          canStart: true,
          status: licenseStatus.status,
          message: `License active. Plan: ${licenseStatus.planKey || 'Unknown'}`
        };
      }

      // Licença inválida - decide se permite inicialização baseado no status
      switch (licenseStatus.status) {
        case 'not_registered':
          return {
            canStart: true, // Permite iniciar para registro
            status: licenseStatus.status,
            message: 'Tenant not registered. Please register your organization.',
            requiresSetup: true
          };
          
        case 'not_licensed':
          return {
            canStart: true, // Permite iniciar para compra de licença
            status: licenseStatus.status,
            message: 'No active license found. Please purchase a license.',
            requiresSetup: true
          };
          
        case 'expired': {
          // Se expirou há muito tempo, pode bloquear inicialização
          const gracePeriodExpired = this.isGracePeriodExpired(licenseStatus.expiresAt);
          
          if (gracePeriodExpired) {
            this.logger.error('License expired and grace period exceeded');
            return {
              canStart: false,
              status: licenseStatus.status,
              message: 'License has expired and grace period exceeded. Please renew your license.'
            };
          }
          
          return {
            canStart: true,
            status: licenseStatus.status,
            message: 'License expired but still within extended grace period.',
            showWarning: true
          };
        }
          
        default:
          this.logger.error(`Unknown license status: ${licenseStatus.status}`);
          return {
            canStart: false,
            status: 'error',
            message: 'License verification failed. Please contact support.'
          };
      }

    } catch (error) {
      this.logger.error('Error during startup license check:', error);
      
      // Em caso de erro, permite inicialização mas com aviso
      return {
        canStart: true,
        status: 'error',
        message: 'Unable to verify license status. Running with limited functionality.',
        showWarning: true
      };
    }
  }

  private isGracePeriodExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return false;
    
    const graceDays = this.configService.get<number>('OFFLINE_GRACE_DAYS', 7);
    const extendedGraceDays = graceDays * 2; // Período estendido para inicialização
    const gracePeriodEnd = new Date(expiresAt.getTime() + (extendedGraceDays * 24 * 60 * 60 * 1000));
    
    return new Date() > gracePeriodEnd;
  }

  /**
   * Atualiza o cache de licença na inicialização se possível
   */
  async updateCacheOnStartup(): Promise<void> {
    const licensingEnforced = this.configService.get<string>('LICENSING_ENFORCED', 'false') === 'true';
    const tenantId = this.configService.get<string>('TENANT_ID');
    
    if (!licensingEnforced || !tenantId) {
      return;
    }

    try {
      this.logger.log('Updating license cache on startup...');
      await this.licensingService.updateLicenseCacheFromHub(tenantId);
      this.logger.log('License cache updated successfully');
    } catch (error) {
      this.logger.warn('Failed to update license cache on startup:', error instanceof Error ? error.message : 'Unknown error');
      // Não falha a inicialização por isso
    }
  }
}