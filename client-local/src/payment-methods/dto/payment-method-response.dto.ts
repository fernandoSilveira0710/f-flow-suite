import { PaymentMethodType } from './create-payment-method.dto';

export class PaymentMethodResponseDto {
  id: string;
  nome: string;
  tipo: PaymentMethodType;
  ativo: boolean;
  ordem: number;
  permiteTroco: boolean;
  permiteParcelas: boolean;
  maxParcelas?: number | null;
  jurosPorParcelaPct?: number | null;
  descontoFixoPct?: number | null;
  taxaFixa?: number | null;
  integracao?: {
    provider?: 'nenhum' | 'maquininha' | 'gateway';
    referenciaExterna?: string;
    imprimeComprovante?: boolean;
  } | null;
  regrasCaixa?: {
    contabilizaNoCaixa?: boolean;
    permiteSangria?: boolean;
  } | null;
  restricoes?: {
    valorMin?: number | null;
    valorMax?: number | null;
    somenteSeCaixaAberto?: boolean;
  } | null;
  visibilidade?: {
    mostrarNoPDV?: boolean;
    visivelSomenteParaRoles?: string[] | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}