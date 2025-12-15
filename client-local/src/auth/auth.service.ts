import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { OfflineLoginResponse } from './auth.controller';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async persistOfflineCredentials(params: {
    email: string;
    password: string;
    tenantId?: string;
    displayName?: string;
    role?: string;
    hubUserId?: string;
  }): Promise<{ success: boolean; message: string; userId?: string }> {
    const { email, password, tenantId, displayName, role, hubUserId } = params;
    try {
      this.logger.log(`💾 Persistindo credenciais offline para ${email}`);

      // 1) Garantir existência/atualização do usuário local
      let user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            displayName: displayName || email.split('@')[0],
            role: role || 'user',
            active: true,
            tenantId: tenantId,
            hubUserId: hubUserId,
          }
        });
        this.logger.log(`👤 Usuário criado localmente: ${user.id}`);
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(displayName ? { displayName } : {}),
            ...(role ? { role } : {}),
            ...(typeof tenantId !== 'undefined' ? { tenantId } : {}),
            ...(hubUserId ? { hubUserId } : {}),
            active: true,
          }
        });
        this.logger.log(`👤 Usuário atualizado localmente: ${user.id}`);
      }

      // 2) Gerar hash seguro da senha fornecida no login do Hub
      const passwordHash = await bcrypt.hash(password, 10);

      // 3) Persistir/atualizar AuthCache com o hash e timestamp
      await this.prisma.authCache.upsert({
        where: { userId: user.id },
        update: {
          email: user.email,
          passwordHash,
          lastHubAuthAt: new Date(),
        },
        create: {
          userId: user.id,
          email: user.email,
          passwordHash,
          lastHubAuthAt: new Date(),
        }
      });

      // 4) Atualizar contador de última verificação da licença (preferindo tenantId efetivo)
      const effectiveTenantId = tenantId ?? user.tenantId ?? undefined;
      if (effectiveTenantId) {
        await this.prisma.licenseCache.upsert({
          where: { tenantId: effectiveTenantId },
          update: { lastChecked: new Date(), updatedAt: new Date() },
          create: {
            tenantId: effectiveTenantId,
            status: 'active',
            registered: true,
            licensed: true,
            planKey: 'starter',
            graceDays: 7,
            lastChecked: new Date(),
            createdAt: new Date(),
          }
        });
        this.logger.log(`⏱️ lastChecked da licença atualizado para tenant ${effectiveTenantId}`);
      }

      return { success: true, message: 'Credenciais offline persistidas com sucesso', userId: user.id };
    } catch (error: any) {
      this.logger.error('❌ Falha ao persistir credenciais offline', error);
      return { success: false, message: error?.message || 'Erro ao persistir credenciais offline' };
    }
  }

  async authenticateOffline(email: string, password: string): Promise<OfflineLoginResponse> {
    try {
      // Permitir bypass de licença em modo desenvolvimento quando LICENSING_ENFORCED !== 'true'
      const licensingEnforced = String(process.env.LICENSING_ENFORCED || 'false') === 'true';

      // 1. Buscar usuário no banco local
      this.logger.log(`👤 Buscando usuário: ${email}`);
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado no cache local. É necessário fazer login online primeiro.'
        };
      }

      if (!user.active) {
        return {
          success: false,
          message: 'Usuário inativo.'
        };
      }

      // 2. Carregar cache de licença do tenant do usuário (a menos que licença não esteja sendo aplicada)
      this.logger.log('🔍 Verificando cache de licença do tenant...');
      let licenseCache: any = null;
      if (user.tenantId) {
        licenseCache = await this.prisma.licenseCache.findUnique({
          where: { tenantId: user.tenantId }
        });
      }
      if (!licensingEnforced && !licenseCache) {
        // Em modo desenvolvimento, permitir login offline mesmo sem cache de licença
        this.logger.warn('LICENSING_ENFORCED=false: permitindo login offline sem licença em cache (development mode).');
      } else if (!licenseCache) {
        return {
          success: false,
          message: 'Nenhuma licença em cache encontrada para o tenant do usuário. É necessário fazer login online primeiro.'
        };
      }

      // 3. Verificar expiração com período de graça para uso offline
      const now = new Date();
      const expiresAt = licenseCache?.expiresAt ?? null;
      const graceDays = (licenseCache as any)?.graceDays ?? 7;
      let licenseStatus: 'cached' | 'offline_grace' | 'development' = licensingEnforced ? 'cached' : 'development';
      if (expiresAt && now > expiresAt) {
        const gracePeriodEnd = new Date(expiresAt.getTime() + graceDays * 24 * 60 * 60 * 1000);
        if (now <= gracePeriodEnd) {
          // Dentro do período de graça: permitir login offline
          licenseStatus = 'offline_grace';
          this.logger.warn(`⚠️ Licença expirada, mas dentro do período de graça de ${graceDays} dias.`);
        } else {
          return {
            success: false,
            message: 'Licença em cache expirada e fora do período de graça. É necessário renovar a licença online.'
          };
        }
      }

      // 4. Bloqueio após X dias sem comunicação com o Hub (configurável via env OFFLINE_MAX_DAYS, padrão 5)
      const lastChecked: Date | null = licenseCache?.lastChecked ?? null;
      const OFFLINE_MAX_DAYS = Math.max(0, Number(process.env.OFFLINE_MAX_DAYS ?? 5));
      if (licensingEnforced && lastChecked) {
        const msSinceLastCheck = now.getTime() - new Date(lastChecked).getTime();
        const daysSinceLastCheck = Math.floor(msSinceLastCheck / (24 * 60 * 60 * 1000));
        if (daysSinceLastCheck > OFFLINE_MAX_DAYS) {
          return {
            success: false,
            message: `Login offline bloqueado: passaram-se mais de ${OFFLINE_MAX_DAYS} dias sem conexão com o Hub. Conecte-se à internet e faça login online para revalidar sua licença. Se o Hub estiver indisponível, tente novamente em alguns minutos e verifique o horário do sistema.`,
          };
      }
      }

      // 5. Validar senha offline usando hash persistido (AuthCache)
      const authCache = await this.prisma.authCache.findUnique({
        where: { userId: user.id },
      });
      if (!authCache) {
        return {
          success: false,
          message: 'Credenciais offline não encontradas. Faça um login online para sincronizar.',
        };
      }
      const passwordOk = await bcrypt.compare(password, authCache.passwordHash);
      if (!passwordOk) {
        return {
          success: false,
          message: 'Senha inválida para modo offline.',
        };
      }
      this.logger.log('✅ Autenticação offline bem-sucedida');

      return {
        success: true,
        message: 'Login offline realizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          tenantId: user.tenantId || '',
          role: user.role
        },
        license: {
          planKey: (licenseCache?.planKey || 'starter'),
          expiresAt: licenseCache?.expiresAt?.toISOString() || '',
          status: licenseStatus
        }
      };

    } catch (error) {
      this.logger.error('💥 Erro na autenticação offline:', error);
      return {
        success: false,
        message: `Erro interno na autenticação offline: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  async authenticateOfflineByPin(email: string, pin: string, tenantId?: string): Promise<OfflineLoginResponse> {
    try {
      // Permitir bypass de licença em modo desenvolvimento quando LICENSING_ENFORCED !== 'true'
      const licensingEnforced = String(process.env.LICENSING_ENFORCED || 'false') === 'true';

      // 1. Buscar usuário no banco local
      this.logger.log(`🔢 Autenticação offline por PIN para: ${email}`);
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado no cache local. É necessário fazer login online primeiro.'
        };
      }

      if (!user.active) {
        return {
          success: false,
          message: 'Usuário inativo.'
        };
      }

      // 2. Validar tenantId se fornecido
      let effectiveTenantId = tenantId ?? user.tenantId ?? undefined;
      if (tenantId && user.tenantId && user.tenantId !== tenantId) {
        if (!licensingEnforced) {
          // Em desenvolvimento, ignorar mismatch e usar o tenantId do usuário local
          this.logger.warn('LICENSING_ENFORCED=false: ignorando mismatch de tenantId, usando tenantId do usuário.');
          effectiveTenantId = user.tenantId ?? undefined;
        } else {
          return {
            success: false,
            message: 'TenantId informado não corresponde ao usuário.'
          };
        }
      }

      // 3. Validar PIN
      const cleanPin = String(pin).replace(/\D/g, '');
      if (cleanPin.length !== 4) {
        return {
          success: false,
          message: 'PIN inválido. Informe 4 dígitos.'
        };
      }
      if (!user.pin) {
        return {
          success: false,
          message: 'PIN não configurado para este usuário.'
        };
      }
      if (user.pin !== cleanPin) {
        return {
          success: false,
          message: 'PIN incorreto.'
        };
      }

      // 4. Carregar cache de licença do tenant
      this.logger.log('🔍 Verificando cache de licença do tenant para PIN...');
      let licenseCache: any = null;
      if (effectiveTenantId) {
        licenseCache = await this.prisma.licenseCache.findUnique({
          where: { tenantId: effectiveTenantId }
        });
      }
      if (!licensingEnforced && !licenseCache) {
        // Em modo desenvolvimento, permitir login offline por PIN mesmo sem cache de licença
        this.logger.warn('LICENSING_ENFORCED=false: permitindo login por PIN sem licença em cache (development mode).');
      } else if (!licenseCache) {
        return {
          success: false,
          message: 'Nenhuma licença em cache encontrada para o tenant do usuário. É necessário fazer login online primeiro.'
        };
      }

      // 5. Verificar expiração com período de graça
      const now = new Date();
      const expiresAt = licenseCache?.expiresAt ?? null;
      const graceDays = (licenseCache as any)?.graceDays ?? 7;
      let licenseStatus: 'cached' | 'offline_grace' | 'development' = licensingEnforced ? 'cached' : 'development';
      if (expiresAt && now > expiresAt) {
        const gracePeriodEnd = new Date(expiresAt.getTime() + graceDays * 24 * 60 * 60 * 1000);
        if (now <= gracePeriodEnd) {
          licenseStatus = 'offline_grace';
          this.logger.warn(`⚠️ Licença expirada, mas dentro do período de graça de ${graceDays} dias.`);
        } else {
          return {
            success: false,
            message: 'Licença em cache expirada e fora do período de graça. É necessário renovar a licença online.'
          };
        }
      }

      // 6. Bloqueio após X dias sem comunicação com o Hub
      const lastChecked: Date | null = licenseCache?.lastChecked ?? null;
      const OFFLINE_MAX_DAYS = Math.max(0, Number(process.env.OFFLINE_MAX_DAYS ?? 5));
      if (licensingEnforced && lastChecked) {
        const msSinceLastCheck = now.getTime() - new Date(lastChecked).getTime();
        const daysSinceLastCheck = Math.floor(msSinceLastCheck / (24 * 60 * 60 * 1000));
        if (daysSinceLastCheck > OFFLINE_MAX_DAYS) {
          return {
            success: false,
            message: `Login offline bloqueado: passaram-se mais de ${OFFLINE_MAX_DAYS} dias sem conexão com o Hub. Conecte-se à internet e faça login online para revalidar sua licença.`,
          };
        }
      }

      this.logger.log('✅ Autenticação offline por PIN bem-sucedida');

      return {
        success: true,
        message: 'Login offline por PIN realizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          tenantId: user.tenantId || '',
          role: user.role
        },
        license: {
          planKey: (licenseCache?.planKey || 'starter'),
          expiresAt: licenseCache?.expiresAt?.toISOString() || '',
          status: licenseStatus
        }
      };
    } catch (error) {
      this.logger.error('💥 Erro na autenticação offline por PIN:', error);
      return {
        success: false,
        message: `Erro interno na autenticação offline por PIN: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}
