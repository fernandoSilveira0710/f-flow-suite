import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OfflineLoginResponse } from './auth.controller';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async authenticateOffline(email: string, password: string): Promise<OfflineLoginResponse> {
    try {
      // 1. Verificar se existe cache de licença válido
      this.logger.log('🔍 Verificando cache de licença...');
      const licenseCache = await this.prisma.licenseCache.findFirst({
        orderBy: { updatedAt: 'desc' }
      });

      if (!licenseCache) {
        return {
          success: false,
          message: 'Nenhuma licença em cache encontrada. É necessário fazer login online primeiro.'
        };
      }

      // 2. Verificar se a licença não expirou
      if (licenseCache.expiresAt && new Date() > licenseCache.expiresAt) {
        return {
          success: false,
          message: 'Licença em cache expirada. É necessário renovar a licença online.'
        };
      }

      // 3. Buscar usuário no banco local
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

      // 4. Para login offline, não validamos senha (assumimos que foi validada online anteriormente)
      // Em um cenário real, você poderia armazenar um hash da senha para validação offline
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
          status: 'cached'
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