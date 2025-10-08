import { IsString, IsEnum, IsBoolean, IsNumber, IsOptional, ValidateNested, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodType {
  CASH = 'CASH',
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  PIX = 'PIX',
  VOUCHER = 'VOUCHER',
  OTHER = 'OTHER'
}

export class PaymentMethodIntegrationDto {
  @IsOptional()
  @IsEnum(['nenhum', 'maquininha', 'gateway'])
  provider?: 'nenhum' | 'maquininha' | 'gateway';

  @IsOptional()
  @IsString()
  referenciaExterna?: string;

  @IsOptional()
  @IsBoolean()
  imprimeComprovante?: boolean;
}

export class PaymentMethodCashRulesDto {
  @IsBoolean()
  contabilizaNoCaixa: boolean;

  @IsBoolean()
  permiteSangria: boolean;
}

export class PaymentMethodRestrictionsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorMax?: number;

  @IsOptional()
  @IsBoolean()
  somenteSeCaixaAberto?: boolean;
}

export class PaymentMethodVisibilityDto {
  @IsBoolean()
  mostrarNoPDV: boolean;

  @IsOptional()
  @IsString({ each: true })
  visivelSomenteParaRoles?: string[];
}

export class CreatePaymentMethodDto {
  @IsString()
  nome: string;

  @IsEnum(PaymentMethodType)
  tipo: PaymentMethodType;

  @IsBoolean()
  ativo: boolean;

  @IsNumber()
  @Min(1)
  ordem: number;

  @IsBoolean()
  permiteTroco: boolean;

  @IsBoolean()
  permiteParcelas: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  maxParcelas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  jurosPorParcelaPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  descontoFixoPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxaFixa?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodIntegrationDto)
  integracao?: PaymentMethodIntegrationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodCashRulesDto)
  regrasCaixa?: PaymentMethodCashRulesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodRestrictionsDto)
  restricoes?: PaymentMethodRestrictionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodVisibilityDto)
  visibilidade?: PaymentMethodVisibilityDto;
}