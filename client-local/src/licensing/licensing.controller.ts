import { Body, Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { LicensingService } from './licensing.service';

export interface ActivateDto {
  tenantId: string;
  deviceId: string;
  licenseKey?: string;
}

export interface ActivateResponse {
  status: 'activated' | 'error';
  message?: string;
  expiresIn?: number;
  graceDays?: number;
  plan?: string;
}

export interface InstallStatusResponse {
  needsSetup: boolean;
  status: 'activated' | 'not_activated' | 'offline_grace' | 'expired' | 'development';
  plan?: string;
  exp?: number;
  grace?: number;
}

@Controller('licensing')
export class LicensingController {
  constructor(private readonly licensingService: LicensingService) {}

  @Post('activate')
  async activate(@Body() dto: ActivateDto): Promise<ActivateResponse> {
    if (!dto?.tenantId || !dto?.deviceId) {
      throw new HttpException(
        'tenantId e deviceId são obrigatórios',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const result = await this.licensingService.activateLicense(
        dto.tenantId,
        dto.deviceId,
        dto.licenseKey
      );

      return result;
    } catch (error: any) {
      this.licensingService.logger.error('License activation failed', error);
      
      if (error.message?.includes('LICENSING_NOT_ENFORCED')) {
        return {
          status: 'activated',
          message: 'Licensing not enforced in development mode'
        };
      }

      return {
        status: 'error',
        message: (error as Error).message || 'Falha na ativação da licença'
      };
    }
  }

  @Get('install/status')
  async getInstallStatus(): Promise<InstallStatusResponse> {
    try {
      return await this.licensingService.getInstallStatus();
    } catch (error) {
      this.licensingService.logger.error('Failed to get install status', error);
      
      // In case of error, assume setup is needed
      return { needsSetup: true, status: 'not_activated' };
    }
  }

  @Get('license')
  async getLicense() {
    try {
      return await this.licensingService.getCurrentLicense();
    } catch (error) {
      throw new HttpException(
        'Licença não encontrada',
        HttpStatus.NOT_FOUND
      );
    }
  }
}