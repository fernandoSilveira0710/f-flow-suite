import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export type PaymentMethodType = 'CASH' | 'DEBIT' | 'CREDIT' | 'PIX' | 'VOUCHER' | 'OTHER';

export class IntegracaoDto {
  @IsOptional()
  @IsIn(['nenhum', 'maquininha', 'gateway'])
  provider?: 'nenhum' | 'maquininha' | 'gateway';

  @IsOptional()
  @IsString()
  referenciaExterna?: string;

  @IsOptional()
  @IsBoolean()
  imprimeComprovante?: boolean;
}

export class RegrasCaixaDto {
  @IsOptional()
  @IsBoolean()
  contabilizaNoCaixa?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteSangria?: boolean;
}

export class RestricoesDto {
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

export class VisibilidadeDto {
  @IsOptional()
  @IsBoolean()
  mostrarNoPDV?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visivelSomenteParaRoles?: string[] | null;
}

export class CreatePaymentMethodDto {
  @IsString()
  nome!: string;

  @IsIn(['CASH', 'DEBIT', 'CREDIT', 'PIX', 'VOUCHER', 'OTHER'])
  tipo!: PaymentMethodType;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number = 0;

  @IsOptional()
  @IsBoolean()
  permiteTroco?: boolean = false;

  @IsOptional()
  @IsBoolean()
  permiteParcelas?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParcelas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  jurosPorParcelaPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descontoFixoPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxaFixa?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => IntegracaoDto)
  integracao?: IntegracaoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegrasCaixaDto)
  regrasCaixa?: RegrasCaixaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RestricoesDto)
  restricoes?: RestricoesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VisibilidadeDto)
  visibilidade?: VisibilidadeDto;
}