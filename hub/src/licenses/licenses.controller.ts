import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
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
}
