import { Controller, Post, Body, Logger, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

export interface OfflineLoginRequest {
  email: string;
  password: string;
}

export interface OfflineLoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    tenantId: string;
    role: string;
  };
  license?: {
    planKey: string;
    expiresAt: string;
    status: string;
  };
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('persist')
  async persist(@Body() body: { email: string; password: string; tenantId?: string; displayName?: string; role?: string; hubUserId?: string }) {
    try {
      this.logger.log(`💾 Persistência de credenciais offline para: ${body.email}`);
      const result = await this.authService.persistOfflineCredentials({
        email: body.email,
        password: body.password,
        tenantId: body.tenantId,
        displayName: body.displayName,
        role: body.role,
        hubUserId: body.hubUserId,
      });

      if (!result.success) {
        throw new HttpException(result.message || 'Falha ao persistir credenciais', HttpStatus.BAD_REQUEST);
      }

      return { success: true, message: 'Credenciais persistidas', userId: result.userId };
    } catch (error: any) {
      this.logger.error(`❌ Erro na persistência de credenciais para ${body.email}:`, error);
      throw new HttpException(
        `Falha ao persistir credenciais: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('offline-login')
  @HttpCode(HttpStatus.OK)
  async offlineLogin(@Body() body: OfflineLoginRequest): Promise<OfflineLoginResponse> {
    try {
      this.logger.log(`🔐 Tentativa de login offline para: ${body.email}`);
      
      const result = await this.authService.authenticateOffline(body.email, body.password);

      if (result.success) {
        this.logger.log(`✅ Login offline bem-sucedido para: ${body.email}`);
        return result;
      }

      this.logger.warn(`❌ Login offline falhou para: ${body.email} - ${result.message}`);
      // Retornar sem sucesso como 401 para alinhar semântica HTTP e evitar falsos "OK"
      throw new HttpException(result.message || 'Falha na autenticação offline', HttpStatus.UNAUTHORIZED);
    } catch (error: any) {
      this.logger.error(`💥 Erro no login offline para ${body.email}:`, error);
      throw new HttpException(
        `Falha na autenticação offline: ${error.message}`,
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}