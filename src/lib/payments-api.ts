/**
 * API de Meios de Pagamento (Hub)
 * Substitui mocks locais por chamadas reais ao 2F License Hub.
 */

import { apiClient, getTenantId } from './api-client';

export type PaymentMethodType = 'CASH' | 'DEBIT' | 'CREDIT' | 'PIX' | 'VOUCHER' | 'OTHER';

export interface PaymentMethod {
  id: string;
  nome: string;
  tipo: PaymentMethodType;
  ativo: boolean;
  ordem: number;
  permiteTroco: boolean;
  permiteParcelas: boolean;
  maxParcelas?: number;
  jurosPorParcelaPct?: number;
  descontoFixoPct?: number;
  taxaFixa?: number;
  integracao?: {
    provider?: 'nenhum' | 'maquininha' | 'gateway';
    referenciaExterna?: string;
    imprimeComprovante?: boolean;
  };
  regrasCaixa?: {
    contabilizaNoCaixa: boolean;
    permiteSangria: boolean;
  };
  restricoes?: {
    valorMin?: number;
    valorMax?: number;
    somenteSeCaixaAberto?: boolean;
  };
  visibilidade?: {
    mostrarNoPDV: boolean;
    visivelSomenteParaRoles?: string[] | null;
  };
  criadoEm: string;
  atualizadoEm: string;
}

const endpointBase = (tenantId: string) => `/tenants/${tenantId}/payment-methods`;

// Mapper: Hub -> UI
function mapFromHub(pm: any): PaymentMethod {
  return {
    id: pm.id,
    nome: pm.nome,
    tipo: pm.tipo,
    ativo: pm.ativo,
    ordem: pm.ordem ?? 0,
    permiteTroco: !!pm.permiteTroco,
    permiteParcelas: !!pm.permiteParcelas,
    maxParcelas: pm.maxParcelas ?? undefined,
    jurosPorParcelaPct: pm.jurosPorParcelaPct ?? undefined,
    descontoFixoPct: pm.descontoFixoPct ?? undefined,
    taxaFixa: pm.taxaFixa ?? undefined,
    integracao: pm.integracao || {
      provider: pm.integracaoProvider || 'nenhum',
      referenciaExterna: pm.referenciaExterna,
      imprimeComprovante: pm.imprimeComprovante,
    },
    regrasCaixa: pm.regrasCaixa || {
      contabilizaNoCaixa: pm.contabilizaNoCaixa ?? true,
      permiteSangria: pm.permiteSangria ?? false,
    },
    restricoes: pm.restricoes || {
      valorMin: pm.valorMin ?? undefined,
      valorMax: pm.valorMax ?? undefined,
      somenteSeCaixaAberto: pm.somenteSeCaixaAberto ?? true,
    },
    visibilidade: pm.visibilidade || {
      mostrarNoPDV: pm.mostrarNoPDV ?? true,
      visivelSomenteParaRoles: pm.visivelSomenteParaRoles
        ? (typeof pm.visivelSomenteParaRoles === 'string'
            ? JSON.parse(pm.visivelSomenteParaRoles)
            : pm.visivelSomenteParaRoles)
        : null,
    },
    criadoEm: pm.criadoEm || pm.createdAt || new Date().toISOString(),
    atualizadoEm: pm.atualizadoEm || pm.updatedAt || new Date().toISOString(),
  };
}

// Payload: UI -> Hub DTO
function mapToHubPayload(data: Partial<PaymentMethod>): any {
  const payload: any = {
    nome: data.nome,
    tipo: data.tipo,
    ativo: data.ativo ?? true,
    ordem: data.ordem ?? 1,
    permiteTroco: data.permiteTroco ?? false,
    permiteParcelas: data.permiteParcelas ?? false,
    maxParcelas: data.permiteParcelas ? data.maxParcelas : undefined,
    jurosPorParcelaPct: data.permiteParcelas ? data.jurosPorParcelaPct : undefined,
    descontoFixoPct: data.descontoFixoPct,
    taxaFixa: data.taxaFixa,
    integracao: data.integracao ? {
      provider: data.integracao.provider,
      referenciaExterna: data.integracao.referenciaExterna,
      imprimeComprovante: data.integracao.imprimeComprovante,
    } : undefined,
    regrasCaixa: data.regrasCaixa ? {
      contabilizaNoCaixa: data.regrasCaixa.contabilizaNoCaixa,
      permiteSangria: data.regrasCaixa.permiteSangria,
    } : undefined,
    restricoes: data.restricoes ? {
      valorMin: data.restricoes.valorMin,
      valorMax: data.restricoes.valorMax,
      somenteSeCaixaAberto: data.restricoes.somenteSeCaixaAberto,
    } : undefined,
    visibilidade: data.visibilidade ? {
      mostrarNoPDV: data.visibilidade.mostrarNoPDV,
      visivelSomenteParaRoles: data.visibilidade.visivelSomenteParaRoles || null,
    } : undefined,
  };

  return payload;
}

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const tenantId = getTenantId();
  const list = await apiClient<any[]>(`${endpointBase(tenantId)}`, { method: 'GET' });
  return (list || []).map(mapFromHub).sort((a, b) => a.ordem - b.ordem);
};

export const getPaymentMethod = async (id: string): Promise<PaymentMethod | null> => {
  const tenantId = getTenantId();
  const item = await apiClient<any>(`${endpointBase(tenantId)}/${id}`, { method: 'GET' });
  return item ? mapFromHub(item) : null;
};

export const getUsablePaymentMethods = async (
  userRole: string = 'Admin',
  caixaAberto: boolean = true
): Promise<PaymentMethod[]> => {
  const tenantId = getTenantId();
  let mapped: PaymentMethod[] = [];
  try {
    const list = await apiClient<any[]>(`${endpointBase(tenantId)}/active`, { method: 'GET' });
    mapped = (list || []).map(mapFromHub);
  } catch (error) {
    console.warn('[Payments] Falha ao buscar métodos no Hub; usando presets locais para PDV.', error);
    mapped = await getPresets();
  }

  return mapped
    .filter((m) => m.ativo)
    .filter((m) => m.visibilidade?.mostrarNoPDV !== false)
    .filter((m) => {
      const roles = m.visibilidade?.visivelSomenteParaRoles || [];
      return !roles || roles.length === 0 || roles.includes(userRole);
    })
    .filter((m) => {
      if (m.restricoes?.somenteSeCaixaAberto) return caixaAberto;
      return true;
    })
    .sort((a, b) => a.ordem - b.ordem);
};

export const createPaymentMethod = async (
  data: Omit<PaymentMethod, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<PaymentMethod> => {
  const tenantId = getTenantId();
  const payload = mapToHubPayload(data);
  const created = await apiClient<any>(`${endpointBase(tenantId)}`, {
    method: 'POST',
    body: payload,
  });
  return mapFromHub(created);
};

export const updatePaymentMethod = async (
  id: string,
  data: Partial<PaymentMethod>
): Promise<PaymentMethod> => {
  const tenantId = getTenantId();
  const payload = mapToHubPayload(data);
  const updated = await apiClient<any>(`${endpointBase(tenantId)}/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return mapFromHub(updated);
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  const tenantId = getTenantId();
  await apiClient(`${endpointBase(tenantId)}/${id}`, { method: 'DELETE' });
};

export const reorderPaymentMethods = async (ids: string[]): Promise<void> => {
  const tenantId = getTenantId();
  await apiClient(`${endpointBase(tenantId)}/reorder`, {
    method: 'PUT',
    body: { ids },
  });
};

// Presets para popular rapidamente (se desejar) — criados via Hub
export const getPresets = async (): Promise<PaymentMethod[]> => {
  const presets: Array<Partial<PaymentMethod>> = [
    { nome: 'PIX', tipo: 'PIX', ativo: true, ordem: 1 },
    { nome: 'Cartão Débito', tipo: 'DEBIT', ativo: true, ordem: 2 },
    { nome: 'Cartão Crédito', tipo: 'CREDIT', ativo: true, ordem: 3, permiteParcelas: true, maxParcelas: 12 },
    { nome: 'Dinheiro', tipo: 'CASH', ativo: true, ordem: 4, permiteTroco: true },
  ];
  return presets.map((p, i) => ({
    id: `preset-${i + 1}`,
    nome: p.nome!,
    tipo: p.tipo!,
    ativo: p.ativo ?? true,
    ordem: p.ordem ?? i + 1,
    permiteTroco: p.permiteTroco ?? false,
    permiteParcelas: p.permiteParcelas ?? false,
    maxParcelas: p.maxParcelas,
    jurosPorParcelaPct: p.jurosPorParcelaPct,
    descontoFixoPct: p.descontoFixoPct,
    taxaFixa: p.taxaFixa,
    integracao: p.integracao,
    regrasCaixa: p.regrasCaixa ?? { contabilizaNoCaixa: true, permiteSangria: false },
    restricoes: p.restricoes ?? { somenteSeCaixaAberto: true },
    visibilidade: p.visibilidade ?? { mostrarNoPDV: true },
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  }));
};

export const importPresets = async (): Promise<void> => {
  const existing = await getPaymentMethods().catch(() => []);
  if (existing && existing.length > 0) return;
  const presets = await getPresets();
  for (const preset of presets) {
    await createPaymentMethod({
      nome: preset.nome,
      tipo: preset.tipo,
      ativo: preset.ativo,
      ordem: preset.ordem,
      permiteTroco: preset.permiteTroco,
      permiteParcelas: preset.permiteParcelas,
      maxParcelas: preset.maxParcelas,
      jurosPorParcelaPct: preset.jurosPorParcelaPct,
      descontoFixoPct: preset.descontoFixoPct,
      taxaFixa: preset.taxaFixa,
      integracao: preset.integracao,
      regrasCaixa: preset.regrasCaixa,
      restricoes: preset.restricoes,
      visibilidade: preset.visibilidade,
      criadoEm: preset.criadoEm,
      atualizadoEm: preset.atualizadoEm,
    } as any);
  }
};

export const calculatePaymentTotal = (
  subtotal: number,
  method: PaymentMethod,
  parcelas: number = 1
): {
  desconto: number;
  juros: number;
  taxa: number;
  total: number;
} => {
  let desconto = 0;
  let juros = 0;
  const taxa = method.taxaFixa || 0;

  if (method.descontoFixoPct && method.descontoFixoPct > 0) {
    desconto = subtotal * (method.descontoFixoPct / 100);
  }

  if (method.permiteParcelas && parcelas > 1 && method.jurosPorParcelaPct && method.jurosPorParcelaPct > 0) {
    juros = subtotal * (method.jurosPorParcelaPct / 100) * (parcelas - 1);
  }

  const total = Math.max(subtotal - desconto + juros + taxa, 0);

  return { desconto, juros, taxa, total };
};

export const getPaymentMethodBadgeColor = (tipo: PaymentMethodType): string => {
  const colors: Record<PaymentMethodType, string> = {
    CASH: 'bg-gray-100 text-gray-800 border-gray-300',
    DEBIT: 'bg-blue-100 text-blue-800 border-blue-300',
    CREDIT: 'bg-purple-100 text-purple-800 border-purple-300',
    PIX: 'bg-green-100 text-green-800 border-green-300',
    VOUCHER: 'bg-amber-100 text-amber-800 border-amber-300',
    OTHER: 'bg-slate-100 text-slate-800 border-slate-300',
  };
  return colors[tipo] || colors.OTHER;
};
