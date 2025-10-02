/**
 * API Mock para Meios de Pagamento
 * Futuramente apontará para 2F License Hub
 */

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
    visivelSomenteParaRoles?: string[];
  };
  criadoEm: string;
  atualizadoEm: string;
}

const STORAGE_KEY = '2f.payments';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getFromStorage = (): PaymentMethod[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const setInStorage = (methods: PaymentMethod[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
};

// Initialize with presets if empty
if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
  const presets: PaymentMethod[] = [
    {
      id: 'pm-1',
      nome: 'Dinheiro',
      tipo: 'CASH',
      ativo: true,
      ordem: 1,
      permiteTroco: true,
      permiteParcelas: false,
      regrasCaixa: {
        contabilizaNoCaixa: true,
        permiteSangria: true,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'pm-2',
      nome: 'Cartão Débito',
      tipo: 'DEBIT',
      ativo: true,
      ordem: 2,
      permiteTroco: false,
      permiteParcelas: false,
      regrasCaixa: {
        contabilizaNoCaixa: false,
        permiteSangria: false,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'pm-3',
      nome: 'Cartão Crédito',
      tipo: 'CREDIT',
      ativo: true,
      ordem: 3,
      permiteTroco: false,
      permiteParcelas: true,
      maxParcelas: 12,
      jurosPorParcelaPct: 0,
      regrasCaixa: {
        contabilizaNoCaixa: false,
        permiteSangria: false,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'pm-4',
      nome: 'PIX',
      tipo: 'PIX',
      ativo: true,
      ordem: 4,
      permiteTroco: false,
      permiteParcelas: false,
      descontoFixoPct: 1.5,
      regrasCaixa: {
        contabilizaNoCaixa: false,
        permiteSangria: false,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
  ];
  setInStorage(presets);
}

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  await delay(200);
  return getFromStorage().sort((a, b) => a.ordem - b.ordem);
};

export const getPaymentMethod = async (id: string): Promise<PaymentMethod | null> => {
  await delay(150);
  const methods = getFromStorage();
  return methods.find(m => m.id === id) || null;
};

export const getUsablePaymentMethods = async (
  userRole: string = 'Admin',
  caixaAberto: boolean = true
): Promise<PaymentMethod[]> => {
  await delay(200);
  const methods = getFromStorage();
  
  return methods
    .filter(m => m.ativo)
    .filter(m => m.visibilidade?.mostrarNoPDV !== false)
    .filter(m => {
      // Check role visibility
      if (m.visibilidade?.visivelSomenteParaRoles && m.visibilidade.visivelSomenteParaRoles.length > 0) {
        return m.visibilidade.visivelSomenteParaRoles.includes(userRole);
      }
      return true;
    })
    .filter(m => {
      // Check caixa requirement
      if (m.restricoes?.somenteSeCaixaAberto) {
        return caixaAberto;
      }
      return true;
    })
    .sort((a, b) => a.ordem - b.ordem);
};

export const createPaymentMethod = async (
  data: Omit<PaymentMethod, 'id' | 'criadoEm' | 'atualizadoEm'>
): Promise<PaymentMethod> => {
  await delay(300);
  const methods = getFromStorage();
  
  const newMethod: PaymentMethod = {
    ...data,
    id: `pm-${Date.now()}`,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
  
  setInStorage([...methods, newMethod]);
  return newMethod;
};

export const updatePaymentMethod = async (
  id: string,
  data: Partial<PaymentMethod>
): Promise<PaymentMethod> => {
  await delay(300);
  const methods = getFromStorage();
  const index = methods.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw new Error('Método de pagamento não encontrado');
  }
  
  const updated = {
    ...methods[index],
    ...data,
    atualizadoEm: new Date().toISOString(),
  };
  
  methods[index] = updated;
  setInStorage(methods);
  return updated;
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  await delay(250);
  const methods = getFromStorage();
  const filtered = methods.filter(m => m.id !== id);
  setInStorage(filtered);
};

export const reorderPaymentMethods = async (ids: string[]): Promise<void> => {
  await delay(200);
  const methods = getFromStorage();
  
  const updated = methods.map(method => {
    const newOrder = ids.indexOf(method.id);
    return {
      ...method,
      ordem: newOrder >= 0 ? newOrder + 1 : method.ordem,
    };
  });
  
  setInStorage(updated);
};

export const getPresets = async (): Promise<PaymentMethod[]> => {
  await delay(100);
  return [
    {
      id: 'preset-cash',
      nome: 'Dinheiro',
      tipo: 'CASH',
      ativo: true,
      ordem: 999,
      permiteTroco: true,
      permiteParcelas: false,
      regrasCaixa: {
        contabilizaNoCaixa: true,
        permiteSangria: true,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'preset-debit',
      nome: 'Cartão Débito',
      tipo: 'DEBIT',
      ativo: true,
      ordem: 999,
      permiteTroco: false,
      permiteParcelas: false,
      regrasCaixa: {
        contabilizaNoCaixa: false,
        permiteSangria: false,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'preset-credit',
      nome: 'Cartão Crédito',
      tipo: 'CREDIT',
      ativo: true,
      ordem: 999,
      permiteTroco: false,
      permiteParcelas: true,
      maxParcelas: 12,
      jurosPorParcelaPct: 0,
      regrasCaixa: {
        contabilizaNoCaixa: false,
        permiteSangria: false,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'preset-pix',
      nome: 'PIX',
      tipo: 'PIX',
      ativo: true,
      ordem: 999,
      permiteTroco: false,
      permiteParcelas: false,
      descontoFixoPct: 1.5,
      regrasCaixa: {
        contabilizaNoCaixa: false,
        permiteSangria: false,
      },
      restricoes: {
        somenteSeCaixaAberto: true,
      },
      visibilidade: {
        mostrarNoPDV: true,
      },
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
  ];
};

export const importPresets = async (): Promise<void> => {
  await delay(300);
  const methods = getFromStorage();
  const presets = await getPresets();
  
  // Only import presets that don't exist (by name and type)
  const newMethods: PaymentMethod[] = [];
  
  for (const preset of presets) {
    const exists = methods.some(
      m => m.nome === preset.nome && m.tipo === preset.tipo
    );
    
    if (!exists) {
      newMethods.push({
        ...preset,
        id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ordem: methods.length + newMethods.length + 1,
      });
    }
  }
  
  if (newMethods.length > 0) {
    setInStorage([...methods, ...newMethods]);
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
  let taxa = method.taxaFixa || 0;
  
  // Apply discount
  if (method.descontoFixoPct && method.descontoFixoPct > 0) {
    desconto = subtotal * (method.descontoFixoPct / 100);
  }
  
  // Apply interest (simple interest)
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
