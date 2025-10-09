import { Body, Controller, Post, Put, Param, HttpException, HttpStatus } from '@nestjs/common';
import { LicensesService } from './licenses.service';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('activate')
  async activate(@Body() dto: { tenantId: string; deviceId: string }) {
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
}
