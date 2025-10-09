import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LicensingService } from './licensing.service';

@Injectable()
export class LicenseCacheGuard implements CanActivate {
  private readonly logger = new Logger(LicenseCacheGuard.name);

  constructor(
    private readonly licensingService: LicensingService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Se o licenciamento não está sendo enforçado, permite acesso
    const licensingEnforced = this.configService.get<string>('LICENSING_ENFORCED', 'false') === 'true';
    
    if (!licensingEnforced) {
      this.logger.debug('Licensing not enforced, allowing access');
      return true;
    }

    try {
      // Obtém o tenantId da configuração ou contexto
      const tenantId = this.configService.get<string>('TENANT_ID');
      
      if (!tenantId) {
        this.logger.warn('No tenant ID configured, blocking access');
        throw new UnauthorizedException('Tenant ID not configured. Please configure your tenant ID first.');
      }

      // Verifica o status da licença usando o cache
      const licenseStatus = await this.licensingService.checkLicenseStatus(tenantId);
      
      // Se a licença é válida, permite acesso
      if (licenseStatus.valid) {
        if (licenseStatus.cached) {
          this.logger.debug(`Valid license found in cache (${licenseStatus.status}), allowing access`);
        } else {
          this.logger.debug(`Valid license verified with Hub (${licenseStatus.status}), allowing access`);
        }
        return true;
      }

      // Se a licença não é válida, bloqueia acesso com mensagem específica
      const errorMessage = this.getErrorMessage(licenseStatus.status, licenseStatus.reason);
      this.logger.warn(`License validation failed: ${licenseStatus.status} - ${licenseStatus.reason}`);
      throw new UnauthorizedException(errorMessage);

    } catch (error: any) {
      this.logger.error('Error checking license status:', error.message);
      
      // Se é erro de autorização, repassa
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Para outros erros, se não está enforçando, permite acesso
      if (!licensingEnforced) {
        this.logger.warn('License check failed but enforcement disabled, allowing access');
        return true;
      }
      
      // Se está enforçando e houve erro, bloqueia acesso
      throw new UnauthorizedException('Unable to verify license status. Please try again later.');
    }
  }

  private getErrorMessage(status: string, reason?: string): string {
    switch (status) {
      case 'not_registered':
        return 'Tenant not registered. Please register your organization first.';
      case 'not_licensed':
        return 'No active license found. Please purchase a license to continue.';
      case 'expired':
        return 'License has expired. Please renew your license to continue using the application.';
      case 'error':
        return 'License verification error. Please contact support if this persists.';
      default:
        return reason || 'License validation failed. Please check your license status.';
    }
  }
}