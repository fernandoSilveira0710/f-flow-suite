import { Controller, Post, Get, Put, Body, HttpException, HttpStatus } from '@nestjs/common';
import { LicensingService } from './licensing.service';

export interface ActivateResponse {
  status: string;
  message?: string;
  expiresIn?: number;
  graceDays?: number;
  plan?: string;
}

export interface InstallStatusResponse {
  needsSetup: boolean;
  status: string;
  plan?: string;
  exp?: number;
  grace?: number;
}

@Controller('licensing')
export class LicensingController {
  constructor(private readonly licensingService: LicensingService) {}

  @Post('activate')
  async activate(@Body() dto: { tenantId: string; deviceId: string; licenseKey?: string }): Promise<ActivateResponse> {
    try {
      return await this.licensingService.activateLicense(dto.tenantId, dto.deviceId, dto.licenseKey);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('install/status')
  async getInstallStatus(): Promise<InstallStatusResponse> {
    return await this.licensingService.getInstallStatus();
  }

  @Get('license')
  async getCurrentLicense() {
    const license = await this.licensingService.getCurrentLicense();
    
    if (!license) {
      throw new HttpException('No license found', HttpStatus.NOT_FOUND);
    }

    return {
      tenantId: license.tid,
      deviceId: license.did,
      plan: license.plan,
      status: license.status,
      entitlements: license.ent,
      expiresAt: new Date(license.exp * 1000).toISOString()
    };
  }

  @Put('plan/sync')
  async syncPlan(@Body() dto: { tenantId: string; planKey: 'starter' | 'pro' | 'max' }) {
    if (!dto.tenantId || !dto.planKey) {
      throw new HttpException('tenantId and planKey are required', HttpStatus.BAD_REQUEST);
    }

    if (!['starter', 'pro', 'max'].includes(dto.planKey)) {
      throw new HttpException('planKey must be starter, pro, or max', HttpStatus.BAD_REQUEST);
    }

    try {
      const success = await this.licensingService.syncPlanWithHub(dto.tenantId, dto.planKey);
      
      if (success) {
        return {
          success: true,
          message: `Plan synchronized successfully: ${dto.planKey}`
        };
      } else {
        throw new HttpException('Failed to sync plan with Hub', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error: any) {
      throw new HttpException(error.message || 'Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}