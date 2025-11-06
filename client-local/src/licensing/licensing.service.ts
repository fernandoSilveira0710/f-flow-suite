import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import axios from 'axios';
import { TokenStore } from './token.store';
import { ActivateResponse, InstallStatusResponse } from './licensing.controller';
import { PrismaService } from '../common/prisma/prisma.service';

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
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.hubBaseUrl = this.configService.get<string>('HUB_BASE_URL', process.env.HUB_API_URL || 'http://localhost:3001');
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
        success: true,
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

      // Store the token securely in TokenStore
      await this.tokenStore.saveToken(tenantId, deviceId, licenseToken);

      // Also persist the token in the database
      await this.prisma.licenseToken.upsert({
        where: {
          tenantId_deviceId: {
            tenantId,
            deviceId
          }
        },
        update: {
          token: licenseToken,
          expiresAt: new Date(decodedToken.exp * 1000),
          revokedAt: null
        },
        create: {
          tenantId,
          deviceId,
          token: licenseToken,
          expiresAt: new Date(decodedToken.exp * 1000)
        }
      });

      this.logger.log(`License activated successfully for tenant ${tenantId}`);

      return {
        success: true,
        message: 'License activated successfully',
        tenantId,
        deviceId,
        planKey: decodedToken.plan,
        expiresAt: new Date(decodedToken.exp * 1000).toISOString()
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
      // First try to get stored token from TokenStore - pass deviceId for proper token retrieval
      let token = await this.tokenStore.getToken(undefined, this.deviceId);
      
      // If no token in TokenStore, try to get from database
      if (!token) {
        const dbToken = await this.prisma.licenseToken.findFirst({
          where: {
            deviceId: this.deviceId,
            revokedAt: null,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            issuedAt: 'desc'
          }
        });
        
        if (dbToken && dbToken.token) {
          token = dbToken.token;
          // Sync token back to TokenStore for future use
          await this.tokenStore.saveToken(dbToken.tenantId, dbToken.deviceId, dbToken.token);
        }
      }
      
      if (token) {
        if (!this.licensingEnforced) {
          return { 
            isInstalled: true,
            hasLicense: false,
            planKey: 'development'
          };
        }

        // Validate the token
        const decodedToken = await this.validateAndDecodeToken(token);
        const now = Math.floor(Date.now() / 1000);
        
        // Check if token is still valid
        if (now <= decodedToken.exp) {
          return {
            isInstalled: true,
            hasLicense: true,
            planKey: decodedToken.plan,
            expiresAt: new Date(decodedToken.exp * 1000).toISOString()
          };
        }
        
        // Check if token is expired but within grace period
        const graceEndTime = decodedToken.exp + (decodedToken.grace * 86400); // grace in seconds
        
        if (now <= graceEndTime) {
          return {
            isInstalled: true,
            hasLicense: true,
            planKey: decodedToken.plan,
            expiresAt: new Date(decodedToken.exp * 1000).toISOString()
          };
        }
        
        // Token expired and outside grace period
        return { 
          isInstalled: false,
          hasLicense: false
        };
      }

      // If no token found, check license cache
      const tenantId = process.env.TENANT_ID;
      if (tenantId) {
        const cachedLicense = await this.getLicenseFromCache(tenantId);
        if (cachedLicense && cachedLicense.licensed) {
          return {
            isInstalled: true,
            hasLicense: true,
            planKey: cachedLicense.planKey,
            expiresAt: cachedLicense.expiresAt?.toISOString()
          };
        }
      }

      // If licensing is not enforced and no token/cache found, return development mode
      if (!this.licensingEnforced) {
        return { 
          isInstalled: true,
          hasLicense: false,
          planKey: 'development'
        };
      }

      // No token and no cache found
      return { 
        isInstalled: false,
        hasLicense: false
      };

    } catch (error) {
      this.logger.error('Failed to check install status', error);
      
      // If licensing is not enforced, return development mode even on error
      if (!this.licensingEnforced) {
        return { 
          isInstalled: true,
          hasLicense: false,
          planKey: 'development'
        };
      }
      
      return { 
        isInstalled: false,
        hasLicense: false
      };
    }
  }

  /**
   * Retorna o token de licença bruto (JWT) armazenado localmente.
   * Prioriza o TokenStore e faz fallback para o banco de dados.
   * Em modo de desenvolvimento, tenta ler de arquivo se configurado.
   */
  async getRawLicenseToken(tenantId?: string, deviceId?: string): Promise<string | null> {
    try {
      // Primeiro tenta obter do armazenamento seguro
      let token = await this.tokenStore.getToken(tenantId, deviceId || this.deviceId);

      // Fallback: buscar do banco de dados se não encontrado
      if (!token) {
        const dbToken = await this.prisma.licenseToken.findFirst({
          where: {
            ...(tenantId ? { tenantId } : {}),
            deviceId: deviceId || this.deviceId,
            revokedAt: null,
            expiresAt: { gt: new Date() }
          },
          orderBy: { issuedAt: 'desc' }
        });

        if (dbToken?.token) {
          token = dbToken.token;
          // Sincroniza de volta para o TokenStore para próximas leituras
          await this.tokenStore.saveToken(dbToken.tenantId, dbToken.deviceId, dbToken.token);
        }
      }

      // Em desenvolvimento, permitir token via arquivo de conveniência
      if (!token && !this.licensingEnforced) {
        const devTokenPath = this.configService.get<string>('LICENSE_DEV_FILE_PATH') || 'license.jwt';
        const fileToken = this.loadLicenseFromFile(devTokenPath);
        if (fileToken) {
          return fileToken;
        }
      }

      return token || null;
    } catch (error) {
      this.logger.warn('Falha ao obter token de licença bruto', error as Error);
      return null;
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

  async validateLicenseOffline(tenantId?: string, deviceId?: string): Promise<{
    valid: boolean;
    reason?: string;
    license?: LicenseToken;
    status?: 'activated' | 'offline_grace' | 'expired' | 'development';
  }> {
    try {
      // Se não está enforced, retorna válido em modo desenvolvimento
      if (!this.licensingEnforced) {
        return {
          valid: true,
          status: 'development',
          license: {
            tid: tenantId || 'dev-tenant',
            did: deviceId || this.deviceId,
            plan: 'development',
            ent: ['POS', 'INVENTORY', 'GROOMING', 'ANALYTICS'],
            exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 ano
            grace: 7,
            iat: Math.floor(Date.now() / 1000),
            iss: 'dev-mode',
            status: 'development'
          }
        };
      }

      // Tentar obter token armazenado
      const token = await this.tokenStore.getToken(tenantId, deviceId || this.deviceId);
      
      if (!token) {
        return {
          valid: false,
          reason: 'NO_LICENSE_FOUND'
        };
      }

      // Validar e decodificar o token
      const decodedToken = await this.validateAndDecodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      
      // Verificar se o token ainda está válido
      if (now <= decodedToken.exp) {
        return {
          valid: true,
          status: 'activated',
          license: decodedToken
        };
      }
      
      // Verificar se está no período de tolerância offline
      const graceEndTime = decodedToken.exp + (decodedToken.grace * 86400); // grace em segundos
      
      if (now <= graceEndTime) {
        return {
          valid: true,
          status: 'offline_grace',
          license: decodedToken
        };
      }
      
      // Token expirado e fora do período de tolerância
      return {
        valid: false,
        reason: 'LICENSE_EXPIRED',
        status: 'expired'
      };

    } catch (error: any) {
      this.logger.error('Erro na validação offline da licença', error);
      return {
        valid: false,
        reason: error.message || 'VALIDATION_ERROR'
      };
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

  /**
   * Atualiza o cache local de licença com informações do Hub
   */
  async updateLicenseCacheFromHub(tenantId: string): Promise<void> {
    try {
      // Chama o endpoint /licenses/validate do Hub
      const response = await axios.get(`${this.hubBaseUrl}/licenses/validate`, {
        params: { tenantId, deviceId: this.deviceId }
      });

      const licenseData = response.data;
      const license = licenseData.license || {};

      // Atualiza ou cria o registro no cache
      await this.prisma.licenseCache.upsert({
        where: { tenantId },
        update: {
          registered: licenseData.registered || false,
          licensed: licenseData.licensed || false,
          status: licenseData.status || 'not_registered',
          planKey: license.planKey || licenseData.planKey,
          maxSeats: license.maxSeats || licenseData.maxSeats,
          expiresAt: license.expiresAt ? new Date(license.expiresAt) : (licenseData.expiresAt ? new Date(licenseData.expiresAt) : null),
          graceDays: license.graceDays || licenseData.graceDays || 7,
          lastChecked: new Date(),
          updatedAt: new Date()
        },
        create: {
          tenantId,
          registered: licenseData.registered || false,
          licensed: licenseData.licensed || false,
          status: licenseData.status || 'not_registered',
          planKey: license.planKey || licenseData.planKey,
          maxSeats: license.maxSeats || licenseData.maxSeats,
          expiresAt: license.expiresAt ? new Date(license.expiresAt) : (licenseData.expiresAt ? new Date(licenseData.expiresAt) : null),
          graceDays: license.graceDays || licenseData.graceDays || 7,
          lastChecked: new Date()
        }
      });

      this.logger.log(`Cache de licença atualizado para tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar cache de licença para tenant ${tenantId}`, error);
      throw error;
    }
  }

  /**
   * Obtém informações de licença do cache local
   */
  async getLicenseFromCache(tenantId: string): Promise<any> {
    try {
      const cachedLicense = await this.prisma.licenseCache.findUnique({
        where: { tenantId }
      });

      if (!cachedLicense) {
        return null;
      }

      // Verifica se o cache não está muito desatualizado (mais de 24 horas)
      const cacheAge = Date.now() - cachedLicense.lastChecked.getTime();
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24 horas em ms

      return {
        ...cachedLicense,
        isStale: cacheAge > maxCacheAge
      };
    } catch (error) {
      this.logger.error(`Erro ao obter licença do cache para tenant ${tenantId}`, error);
      return null;
    }
  }

  /**
   * Verifica se a licença está válida usando cache local e Hub quando possível
   */
  async checkLicenseStatus(tenantId: string): Promise<{
    valid: boolean;
    status: string;
    reason?: string;
    cached?: boolean;
    planKey?: string;
    expiresAt?: Date;
    lastChecked?: Date;
    updatedAt?: Date;
    graceDays?: number;
  }> {
    try {
      // Em modo desenvolvimento, considerar licença válida para não bloquear fluxo offline
      if (!this.licensingEnforced) {
        const cachedLicense = await this.getLicenseFromCache(tenantId);
        return {
          valid: true,
          status: 'development',
          cached: !!cachedLicense,
          planKey: cachedLicense?.planKey || 'starter',
          expiresAt: cachedLicense?.expiresAt,
          lastChecked: cachedLicense?.lastChecked,
          updatedAt: cachedLicense?.updatedAt,
          graceDays: cachedLicense?.graceDays,
        };
      }

      // Primeiro tenta obter do cache
      const cachedLicense = await this.getLicenseFromCache(tenantId);

      // Se não há cache ou está desatualizado, tenta atualizar do Hub
      if (!cachedLicense || cachedLicense.isStale) {
        try {
          await this.updateLicenseCacheFromHub(tenantId);
          // Obtém novamente do cache após atualização
          const updatedCache = await this.getLicenseFromCache(tenantId);
          if (updatedCache) {
            const evalResult = this.evaluateLicenseStatus(updatedCache, false);
            return {
              ...evalResult,
              lastChecked: updatedCache.lastChecked,
              updatedAt: updatedCache.updatedAt,
              graceDays: updatedCache.graceDays,
            };
          }
        } catch (error) {
          this.logger.warn(`Não foi possível atualizar cache do Hub, usando cache local se disponível`);
          // Se falhou ao atualizar do Hub, usa cache local se disponível
          if (cachedLicense) {
            const evalResult = this.evaluateLicenseStatus(cachedLicense, true);
            return {
              ...evalResult,
              lastChecked: cachedLicense.lastChecked,
              updatedAt: cachedLicense.updatedAt,
              graceDays: cachedLicense.graceDays,
            };
          }
        }
      } else {
        // Cache está atualizado, usa ele
        const evalResult = this.evaluateLicenseStatus(cachedLicense, true);
        return {
          ...evalResult,
          lastChecked: cachedLicense.lastChecked,
          updatedAt: cachedLicense.updatedAt,
          graceDays: cachedLicense.graceDays,
        };
      }

      // Se chegou aqui, não há cache e não conseguiu conectar ao Hub
      return {
        valid: false,
        status: 'not_registered',
        reason: 'Não foi possível verificar licença - sem conexão com Hub e sem cache local'
      };

    } catch (error) {
      this.logger.error(`Erro ao verificar status da licença para tenant ${tenantId}`, error);
      return {
        valid: false,
        status: 'error',
        reason: 'Erro interno ao verificar licença'
      };
    }
  }

  /**
   * Avalia o status da licença baseado nos dados do cache
   */
  private evaluateLicenseStatus(licenseData: any, cached: boolean): {
    valid: boolean;
    status: string;
    reason?: string;
    cached: boolean;
    planKey?: string;
    expiresAt?: Date;
  } {
    const now = new Date();

    // Se não está registrado
    if (!licenseData.registered) {
      return {
        valid: false,
        status: 'not_registered',
        reason: 'Tenant não registrado no Hub',
        cached
      };
    }

    // Se não tem licença
    if (!licenseData.licensed) {
      return {
        valid: false,
        status: 'not_licensed',
        reason: 'Tenant registrado mas sem licença ativa',
        cached
      };
    }

    // Se tem licença, verifica expiração
    if (licenseData.expiresAt && now > licenseData.expiresAt) {
      // Verifica período de graça
      const gracePeriodEnd = new Date(licenseData.expiresAt.getTime() + (licenseData.graceDays * 24 * 60 * 60 * 1000));
      
      if (now <= gracePeriodEnd) {
        return {
          valid: true,
          status: 'offline_grace',
          reason: 'Licença expirada mas dentro do período de graça',
          cached,
          planKey: licenseData.planKey,
          expiresAt: licenseData.expiresAt
        };
      } else {
        return {
          valid: false,
          status: 'expired',
          reason: 'Licença expirada e fora do período de graça',
          cached,
          planKey: licenseData.planKey,
          expiresAt: licenseData.expiresAt
        };
      }
    }

    // Licença válida
    return {
      valid: true,
      status: 'active',
      cached,
      planKey: licenseData.planKey,
      expiresAt: licenseData.expiresAt
    };
  }

  /**
   * Atualiza o cache de licença com novos dados
   */
  async updateLicenseCache(updateData: { tenantId: string; planKey: string; lastChecked: string; updatedAt: string }) {
    this.logger.log(`Updating license cache for tenant ${updateData.tenantId}: ${updateData.planKey}`);
    
    try {
      const updatedCache = await this.prisma.licenseCache.upsert({
        where: { tenantId: updateData.tenantId },
        update: {
          planKey: updateData.planKey,
          lastChecked: new Date(updateData.lastChecked),
          updatedAt: new Date(updateData.updatedAt)
        },
        create: {
          tenantId: updateData.tenantId,
          planKey: updateData.planKey,
          status: 'active', // Campo obrigatório
          lastChecked: new Date(updateData.lastChecked),
          updatedAt: new Date(updateData.updatedAt),
          createdAt: new Date()
        }
      });

      this.logger.log(`License cache updated successfully for tenant ${updateData.tenantId}`);
      return updatedCache;
    } catch (error) {
      this.logger.error(`Failed to update license cache for tenant ${updateData.tenantId}:`, error);
      throw error;
    }
  }
}
