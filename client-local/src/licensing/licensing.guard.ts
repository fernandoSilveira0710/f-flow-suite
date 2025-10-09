import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LicensingService } from './licensing.service';

@Injectable()
export class LicensingGuard implements CanActivate {
  private readonly logger = new Logger(LicensingGuard.name);

  constructor(
    private readonly licensingService: LicensingService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Se o licenciamento não está sendo enforçado, permite acesso
    const licensingEnforced = this.configService.get<string>('LICENSING_ENFORCED', 'true') === 'true';
    
    if (!licensingEnforced) {
      this.logger.debug('Licensing not enforced, allowing access');
      return true;
    }

    try {
      // Verifica o status da licença
      const status = await this.licensingService.getInstallStatus();
      
      // Se não está instalado ou não tem licença, bloqueia acesso
      if (!status.isInstalled || !status.hasLicense) {
        this.logger.warn('License setup required, blocking access to business routes');
        throw new UnauthorizedException('License activation required. Please activate your license first.');
      }

      // Se tem licença válida e está instalado, permite acesso
      if (status.isInstalled && status.hasLicense) {
        this.logger.debug('Valid license found, allowing access');
        return true;
      }

      // Qualquer outro status bloqueia acesso
      this.logger.warn(`Invalid license status, blocking access`);
      throw new UnauthorizedException('Invalid license status. Please check your license activation.');

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
}