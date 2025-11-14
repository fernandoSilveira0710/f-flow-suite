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