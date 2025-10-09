import { Body, Controller, Post, Put, Param, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { CreateLicenseDto, ActivateLicenseDto, ValidateLicenseDto } from './dto/create-license.dto';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('create')
  async createLicense(@Body() createLicenseDto: CreateLicenseDto) {
    try {
      const result = await this.licensesService.createLicenseAfterPayment(createLicenseDto);
      
      return {
        success: true,
        message: 'Licença criada com sucesso',
        data: {
          tenantId: result.tenantId,
          licenseKey: result.licenseKey,
          downloadUrl: result.downloadUrl,
          expiresAt: result.expiresAt,
          plan: result.license.planKey,
          maxSeats: result.license.maxSeats,
        }
      };
    } catch (error: any) {
      throw new HttpException(
        `Erro ao criar licença: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('activate')
  async activate(@Body() dto: ActivateLicenseDto) {
    if (!dto?.tenantId || !dto?.deviceId) {
      throw new HttpException(
        'tenantId e deviceId são obrigatórios',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const licenseToken = await this.licensesService.issue(
        dto.tenantId,
        dto.deviceId
      );

      return { licenseToken };
    } catch (error: any) {
      if (error?.message === 'LICENSE_NOT_FOUND') {
        throw new HttpException(
          'Licença não encontrada para o tenant especificado',
          HttpStatus.NOT_FOUND
        );
      }
      
      if (error?.message === 'MISSING_LICENSE_PRIVATE_KEY_PEM') {
        throw new HttpException(
          'Configuração de chave privada ausente',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      throw new HttpException(
        'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':tenantId/plan')
  async updatePlan(
    @Param('tenantId') tenantId: string,
    @Body() dto: { planKey: 'starter' | 'pro' | 'max' }
  ) {
    if (!dto?.planKey) {
      throw new HttpException(
        'planKey é obrigatório',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!['starter', 'pro', 'max'].includes(dto.planKey)) {
      throw new HttpException(
        'planKey deve ser starter, pro ou max',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const updatedLicense = await this.licensesService.updatePlan(tenantId, dto.planKey);
      return { 
        success: true, 
        license: updatedLicense,
        message: `Plano atualizado para ${dto.planKey}` 
      };
    } catch (error: any) {
      if (error?.message === 'TENANT_NOT_FOUND') {
        throw new HttpException(
          'Tenant não encontrado',
          HttpStatus.NOT_FOUND
        );
      }

      throw new HttpException(
        'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('validate')
  async validateLicense(@Query() query: ValidateLicenseDto) {
    try {
      const result = await this.licensesService.validateLicense(
        query.licenseKey,
        query.tenantId,
        query.deviceId
      );

      if (!result.valid) {
        return {
          valid: false,
          registered: result.license !== null,
          licensed: false,
          status: result.reason === 'LICENSE_NOT_FOUND' ? 'not_registered' : 
                  result.reason === 'LICENSE_EXPIRED' ? 'expired' : 'inactive',
          reason: result.reason,
          message: this.getValidationMessage(result.reason),
          expiresAt: result.license?.expiry || null,
          planKey: result.license?.planKey || null
        };
      }

      return {
        valid: true,
        registered: true,
        licensed: true,
        status: 'active',
        license: {
          tenantId: result.license.tenantId,
          planKey: result.license.planKey,
          maxSeats: result.license.maxSeats,
          status: result.license.status,
          expiresAt: result.license.expiry,
          graceDays: result.license.graceDays || 7,
          tenant: {
            name: result.license.tenant?.name,
            email: result.license.tenant?.email
          }
        }
      };
    } catch (error: any) {
      throw new HttpException(
        `Erro ao validar licença: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private getValidationMessage(reason: string): string {
    const messages = {
      'LICENSE_NOT_FOUND': 'Licença não encontrada',
      'LICENSE_INACTIVE': 'Licença inativa',
      'LICENSE_EXPIRED': 'Licença expirada',
      'LICENSE_INACTIVE_OR_NOT_FOUND': 'Licença inativa ou não encontrada',
      'INSUFFICIENT_PARAMETERS': 'Parâmetros insuficientes para validação',
      'MISSING_LICENSE_PUBLIC_KEY_PEM': 'Chave pública de validação não configurada',
      'VALIDATION_ERROR': 'Erro na validação da licença'
    };

    return messages[reason] || 'Erro desconhecido na validação';
  }
}
