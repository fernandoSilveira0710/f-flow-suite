import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import * as jose from 'jose';
import axios from 'axios';
import { TokenStore } from './token.store';
import { ActivateResponse, InstallStatusResponse } from './licensing.controller';

export interface LicenseToken {
  tid: string; // tenantId
  did: string; // deviceId
  plan: string;
  ent: Record<string, unknown>; // entitlements
  exp: number; // expiration timestamp
  grace: number; // grace days
  iat: number; // issued at
  iss: string; // issuer
}

@Injectable()
export class LicensingService implements OnModuleInit {
  public readonly logger = new Logger(LicensingService.name);
  private hubBaseUrl: string;
  private licensingEnforced: boolean;
  private publicKey: string | null = null;

  constructor(private readonly tokenStore: TokenStore) {
    this.hubBaseUrl = process.env.HUB_BASE_URL || 'http://localhost:3000';
    this.licensingEnforced = process.env.LICENSING_ENFORCED === 'true';
    
    if (!this.licensingEnforced) {
      this.logger.warn('LICENSING_ENFORCED is disabled - running in development mode');
    }
  }

  async onModuleInit() {
    // Load public key if available
    try {
      const publicKeyPem = process.env.LICENSE_PUBLIC_KEY_PEM;
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
    if (!this.licensingEnforced) {
      return { 
        needsSetup: false,
        plan: 'development'
      };
    }

    try {
      // Try to get stored token
      const token = await this.tokenStore.getToken();
      
      if (!token) {
        return { needsSetup: true };
      }

      // Validate the token
      const decodedToken = await this.validateAndDecodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired and outside grace period
      const graceEndTime = decodedToken.exp + (decodedToken.grace * 86400); // grace in seconds
      
      if (now > graceEndTime) {
        this.logger.warn('License expired and outside grace period');
        return { needsSetup: true };
      }

      return {
        needsSetup: false,
        plan: decodedToken.plan,
        exp: decodedToken.exp,
        grace: decodedToken.grace
      };
    } catch (error) {
      this.logger.error('Failed to check install status', error);
      return { needsSetup: true };
    }
  }

  async getCurrentLicense(): Promise<LicenseToken | null> {
    if (!this.licensingEnforced) {
      return {
        tid: 'dev-tenant',
        did: 'dev-device',
        plan: 'development',
        ent: {},
        exp: Math.floor(Date.now() / 1000) + 86400, // 24h from now
        grace: 7,
        iat: Math.floor(Date.now() / 1000),
        iss: 'dev-mode'
      };
    }

    try {
      const token = await this.tokenStore.getToken();
      
      if (!token) {
        return null;
      }

      return await this.validateAndDecodeToken(token);
    } catch (error) {
      this.logger.error('Failed to get current license', error);
      return null;
    }
  }

  private async validateAndDecodeToken(token: string): Promise<LicenseToken> {
    try {
      if (this.publicKey) {
        // Validate signature if public key is available
        const publicKey = await jose.importSPKI(this.publicKey, 'RS256');
        const { payload } = await jose.jwtVerify(token, publicKey, {
          algorithms: ['RS256']
        });
        
        return payload as unknown as LicenseToken;
      } else {
        // Just decode without validation if no public key
        this.logger.warn('No public key available - decoding token without signature validation');
        const { payload } = jose.decodeJwt(token);
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
