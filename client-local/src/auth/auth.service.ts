import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { OfflineLoginResponse } from './auth.controller';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async authenticateOffline(email: string, password: string): Promise<OfflineLoginResponse> {
    try {
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

      // 2. Carregar cache de licença do tenant do usuário
      this.logger.log('🔍 Verificando cache de licença do tenant...');
      let licenseCache: any = null;
      if (user.tenantId) {
        licenseCache = await this.prisma.licenseCache.findUnique({
          where: { tenantId: user.tenantId }
        });
      }

      if (!licenseCache) {
        return {
          success: false,
          message: 'Nenhuma licença em cache encontrada para o tenant do usuário. É necessário fazer login online primeiro.'
        };
      }

      // 3. Verificar expiração com período de graça para uso offline
      const now = new Date();
      const expiresAt = licenseCache.expiresAt ?? null;
      const graceDays = (licenseCache as any).graceDays ?? 7;
      let licenseStatus: 'cached' | 'offline_grace' = 'cached';
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

      // 4. Bloqueio após X dias sem comunicação com o Hub (regra: 5 dias)
      const lastChecked: Date | null = licenseCache.lastChecked ?? null;
      const OFFLINE_MAX_DAYS = 5;
      if (lastChecked) {
        const msSinceLastCheck = now.getTime() - new Date(lastChecked).getTime();
        const daysSinceLastCheck = Math.floor(msSinceLastCheck / (24 * 60 * 60 * 1000));
        if (daysSinceLastCheck > OFFLINE_MAX_DAYS) {
          return {
            success: false,
            message: `Acesso offline bloqueado: mais de ${OFFLINE_MAX_DAYS} dias sem contato com o Hub. Faça login online para revalidar.`,
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
          planKey: licenseCache.planKey || 'unknown',
          expiresAt: licenseCache.expiresAt?.toISOString() || '',
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
}