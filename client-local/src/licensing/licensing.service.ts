import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import axios from 'axios';
import { TokenStore } from './token.store';
import { ActivateResponse, InstallStatusResponse } from './licensing.controller';

export interface LicenseToken {
  tid: string; // tenantId
  did: string; // deviceId
  plan: string;
  ent: Record<string, unknown> | string[]; // entitlements - can be object or array
  exp: number; // expiration timestamp
  grace: number; // grace days
  iat: number; // issued at
  iss: string; // issuer
  status?: 'activated' | 'offline_grace' | 'expired' | 'development'; // status for response
}

@Injectable()
export class LicensingService implements OnModuleInit {
  public readonly logger = new Logger(LicensingService.name);
  private hubBaseUrl: string;
  private licensingEnforced: boolean;
  private publicKey: string | null = null;
  private deviceId: string;

  constructor(
    private readonly tokenStore: TokenStore,
    private readonly configService: ConfigService
  ) {
    this.hubBaseUrl = this.configService.get<string>('HUB_BASE_URL', 'http://localhost:3000');
    this.licensingEnforced = this.configService.get<string>('LICENSING_ENFORCED', 'false') === 'true';
    this.deviceId = this.configService.get<string>('DEVICE_ID', 'dev-device');
    
    if (!this.licensingEnforced) {
      this.logger.warn('LICENSING_ENFORCED is disabled - running in development mode');
    }
  }

  async onModuleInit() {
    // Load public key if available
    try {
      const publicKeyPem = this.configService.get<string>('LICENSE_PUBLIC_KEY_PEM');
      if (publicKeyPem) {
        this.publicKey = publicKeyPem;
        this.logger.log('License public key loaded for token validation');
      }
    } catch (error) {
      this.logger.warn('Failed to load public key', error);
    }
  }

  async activateLicense(
    tenantId: string,
    deviceId: string,
    licenseKey?: string
  ): Promise<ActivateResponse> {
    if (!this.licensingEnforced) {
      return {
        status: 'activated',
        message: 'Licensing not enforced in development mode'
      };
    }

    try {
      // Call Hub to activate license
      const response = await axios.post(`${this.hubBaseUrl}/licenses/activate`, {
        tenantId,
        deviceId,
        licenseKey
      });

      const { licenseToken } = response.data;

      if (!licenseToken) {
        throw new Error('No license token received from Hub');
      }

      // Validate and decode the token
      const decodedToken = await this.validateAndDecodeToken(licenseToken);

      // Store the token securely
      await this.tokenStore.saveToken(tenantId, deviceId, licenseToken);

      this.logger.log(`License activated successfully for tenant ${tenantId}`);

      return {
        status: 'activated',
        expiresIn: decodedToken.exp - Math.floor(Date.now() / 1000),
        graceDays: decodedToken.grace,
        plan: decodedToken.plan
      };
    } catch (error: any) {
      this.logger.error('License activation failed', error);
      
      if (error.response?.status === 404) {
        throw new Error('Licença não encontrada para o tenant especificado');
      }
      
      if (error.response?.status === 400) {
        throw new Error('Parâmetros inválidos para ativação');
      }

      throw new Error('Falha na comunicação com o servidor de licenças');
    }
  }

  async getInstallStatus(): Promise<InstallStatusResponse> {
    try {
      // Try to get stored token - pass deviceId for proper token retrieval
      const token = await this.tokenStore.getToken(undefined, this.deviceId);
      
      if (!token) {
        return { 
          needsSetup: true,
          status: 'not_activated'
        };
      }

      if (!this.licensingEnforced) {
        return { 
          needsSetup: false,
          status: 'development',
          plan: 'development'
        };
      }

      // Validate the token
      const decodedToken = await this.validateAndDecodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is still valid
      if (now <= decodedToken.exp) {
        return {
          needsSetup: false,
          status: 'activated',
          plan: decodedToken.plan,
          exp: decodedToken.exp,
          grace: decodedToken.grace
        };
      }
      
      // Check if token is expired but within grace period
      const graceEndTime = decodedToken.exp + (decodedToken.grace * 86400); // grace in seconds
      
      if (now <= graceEndTime) {
        return {
          needsSetup: false,
          status: 'offline_grace',
          plan: decodedToken.plan,
          exp: decodedToken.exp,
          grace: decodedToken.grace
        };
      }
      
      // Token expired and outside grace period
      this.logger.warn('License expired and outside grace period');
      return { 
        needsSetup: true,
        status: 'expired'
      };

    } catch (error) {
      this.logger.error('Failed to check install status', error);
      return { 
        needsSetup: true,
        status: 'not_activated'
      };
    }
  }

  async getCurrentLicense(): Promise<LicenseToken | null> {
    if (!this.licensingEnforced) {
      // Get development license expiration from environment or default to 24 hours
      const devExpirationHours = parseInt(process.env.LICENSE_DEV_EXPIRATION_HOURS || '24', 10);
      const devExpirationSeconds = devExpirationHours * 3600;
      
      return {
        tid: 'dev-tenant',
        did: this.deviceId,
        plan: 'enterprise',
        ent: ['POS', 'INVENTORY', 'GROOMING', 'ANALYTICS'],
        exp: Math.floor(Date.now() / 1000) + devExpirationSeconds,
        grace: 7,
        iat: Math.floor(Date.now() / 1000),
        iss: 'dev-mode',
        status: 'development'
      };
    }

    try {
      const token = await this.tokenStore.getToken();
      
      if (!token) {
        return null;
      }

      const decodedToken = await this.validateAndDecodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      
      // Add status based on token validity
      if (now <= decodedToken.exp) {
        decodedToken.status = 'activated';
      } else {
        const graceEndTime = decodedToken.exp + (decodedToken.grace * 86400);
        if (now <= graceEndTime) {
          decodedToken.status = 'offline_grace';
        } else {
          decodedToken.status = 'expired';
        }
      }
      
      return decodedToken;
    } catch (error) {
      this.logger.error('Failed to get current license', error);
      return null;
    }
  }

  async syncPlanWithHub(tenantId: string, planKey: 'starter' | 'pro' | 'max'): Promise<boolean> {
    if (!this.licensingEnforced) {
      this.logger.warn('Plan sync skipped - licensing not enforced');
      return true;
    }

    try {
      const response = await axios.put(`${this.hubBaseUrl}/licenses/${tenantId}/plan`, {
        planKey
      });

      if (response.status === 200) {
        this.logger.log(`Plan updated successfully in Hub: ${planKey}`);
        
        // Tentar renovar a licença para obter os novos entitlements
        try {
          await this.activateLicense(tenantId, this.deviceId);
          this.logger.log('License renewed with new plan entitlements');
        } catch (renewError) {
          this.logger.warn('Failed to renew license after plan update', renewError);
        }
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      this.logger.error('Failed to sync plan with Hub', error);
      
      if (error.response?.status === 404) {
        this.logger.error('Tenant not found in Hub');
      } else if (error.response?.status === 400) {
        this.logger.error('Invalid plan key provided');
      }
      
      return false;
    }
  }

  private async validateAndDecodeToken(token: string): Promise<LicenseToken> {
    try {
      if (this.publicKey) {
        // Validate signature if public key is available
        const { importSPKI, jwtVerify } = await import('jose');
        const publicKey = await importSPKI(this.publicKey, 'RS256');
        const { payload } = await jwtVerify(token, publicKey, {
          algorithms: ['RS256']
        });
        
        return payload as unknown as LicenseToken;
      } else {
        // Just decode without validation if no public key
        this.logger.warn('No public key available - decoding token without signature validation');
        const { decodeJwt } = await import('jose');
        const payload = decodeJwt(token);
        return payload as unknown as LicenseToken;
      }
    } catch (error) {
      this.logger.error('Token validation failed', error);
      throw new Error('Token inválido ou expirado');
    }
  }

  loadLicenseFromFile(path: string) {
    try {
      const contents = readFileSync(path, 'utf-8');
      return contents.trim();
    } catch (error) {
      this.logger.error(`Unable to read license file at ${path}`, error as Error);
      return null;
    }
  }
}
