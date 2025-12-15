/**
 * POS API - Real API Integration
 * Connects to client-local server for POS operations
 */

import { API_URLS } from './env';
import { getCurrentPermissions } from './settings-api';

// Types and Interfaces
export interface Product {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  estoque: number;
  categoria?: string;
  barcode?: string;
}

export interface CartItem {
  id: string;
  produto: Product;
  qtd: number;
  subtotal: number;
  itemDiscount?: number;
  finalized?: boolean;
}

export interface Sale {
  id: string;
  code: string;
  operator: string;
  paymentMethod: string;
  status: string;
  total: number;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
  // Pagamentos fracionados persistidos localmente (opcional)
  payments?: { method: string; amount: number; installments?: number }[];
}

export interface SaleItem {
  id: string;
  productId: string;
  productName?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export interface CashEntry {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  timestamp: string;
}

export interface Session {
  id: string;
  operador: { id: string; nome: string };
  abertoEm: string;
  fechadoEm?: string;
  saldoInicial: number;
  status: 'Aberto' | 'Fechado';
  cash: CashEntry[];
  vendasIds: string[];
  resumoFechamento?: {
    totalVendas: number;
    totalDinheiro: number;
    totalCartao: number;
    totalPix: number;
    totalOutros: number;
    totalSangria: number;
    totalSuprimento: number;
    saldoFinalCalculado: number;
    observacao?: string;
  };
}

// API Configuration
const API_BASE_URL = API_URLS.CLIENT_LOCAL;

// Storage keys for cart and session (still needed for frontend state)
const STORAGE_KEYS = {
  cart: '2f.pos.cart',
  session: '2f.pos.session.current',
  sessionsClosed: '2f.pos.sessions.closed',
  // Mapa saleId -> pagamentos fracionados
  salePayments: '2f.pos.sale.payments',
};

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setInStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Helpers: pagamentos fracionados
const getSalePaymentsMap = (): Record<string, { method: string; amount: number; installments?: number }[]> =>
  getFromStorage<Record<string, { method: string; amount: number; installments?: number }[]>>(STORAGE_KEYS.salePayments, {} as any);

const saveSalePayments = (saleId: string, payments: { method: string; amount: number; installments?: number }[]) => {
  const map = getSalePaymentsMap();
  map[saleId] = payments.map(p => ({ method: p.method, amount: Number(p.amount.toFixed(2)), installments: p.installments }));
  setInStorage(STORAGE_KEYS.salePayments, map);
};

// API Helper function
const apiCall = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Import mockAPI to get products from the Products tab
 

// Products API
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const products = await getProducts();
    if (!query.trim()) return products;

    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.nome?.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        (p.barcode || '').toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

export const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const products = await getProducts();
    const product = products.find(
      (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
    );
    return product || null;
  } catch (error) {
    console.error('Error finding product by barcode:', error);
    return null;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const products = await apiCall<any[]>('/products');
    return products
      .filter((p) => p.active !== false)
      .map((p) => ({
        id: p.id,
        nome: p.name,
        sku: p.sku,
        preco: Number(p.price ?? 0),
        estoque: Number(p.currentStock ?? 0),
        categoria: p.category,
        barcode: p.barcode,
        imageUrl: p.imageUrl,
      }));
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const p = await apiCall<any>(`/products/${id}`);
    if (!p) return null;
    return {
      id: p.id,
      nome: p.name,
      sku: p.sku,
      preco: Number(p.price ?? 0),
      estoque: Number(p.currentStock ?? 0),
      categoria: p.category,
      barcode: p.barcode,
      imageUrl: p.imageUrl,
    };
  } catch (error) {
    console.error('Error getting product by id:', error);
    return null;
  }
};

// Cart API (still uses localStorage for frontend state)
export const getCart = (): CartItem[] => {
  return getFromStorage<CartItem[]>(STORAGE_KEYS.cart, []);
};

export const addToCart = async (productId: string, qtd: number = 1): Promise<CartItem[]> => {
  await delay(200);
  
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Produto não encontrado');
  }

  const cart = getCart();
  const existingItem = cart.find(item => item.produto.id === productId);

  if (existingItem) {
    existingItem.qtd += qtd;
    const currentDiscount = existingItem.itemDiscount ?? 0;
    existingItem.subtotal = Math.max(0, existingItem.qtd * existingItem.produto.preco - currentDiscount);
  } else {
    const newItem: CartItem = {
      id: Date.now().toString(),
      produto: product,
      qtd,
      subtotal: qtd * product.preco,
      itemDiscount: 0,
      finalized: false,
    };
    cart.push(newItem);
  }

  setInStorage(STORAGE_KEYS.cart, cart);
  return cart;
};

export const updateCartItem = async (itemId: string, qtd: number): Promise<CartItem[]> => {
  await delay(200);
  
  const cart = getCart();
  const item = cart.find(item => item.id === itemId);
  
  if (item) {
    if (qtd <= 0) {
      const index = cart.indexOf(item);
      cart.splice(index, 1);
    } else {
      item.qtd = qtd;
      const currentDiscount = item.itemDiscount ?? 0;
      item.subtotal = Math.max(0, qtd * item.produto.preco - currentDiscount);
    }
  }

  setInStorage(STORAGE_KEYS.cart, cart);
  return cart;
};

export const removeFromCart = async (itemId: string): Promise<CartItem[]> => {
  await delay(200);
  
  const cart = getCart();
  const index = cart.findIndex(item => item.id === itemId);
  
  if (index !== -1) {
    cart.splice(index, 1);
  }

  setInStorage(STORAGE_KEYS.cart, cart);
  return cart;
};

export const clearCart = async (): Promise<void> => {
  await delay(200);
  setInStorage(STORAGE_KEYS.cart, []);
};

export const updateCartItemDiscount = async (itemId: string, discountAmount: number): Promise<CartItem[]> => {
  await delay(150);
  const cart = getCart();
  const item = cart.find((it) => it.id === itemId);
  if (item) {
    item.itemDiscount = Math.max(0, Number((discountAmount || 0).toFixed(2)));
    const base = item.qtd * item.produto.preco;
    item.subtotal = Math.max(0, Number((base - (item.itemDiscount || 0)).toFixed(2)));
  }
  setInStorage(STORAGE_KEYS.cart, cart);
  return cart;
};

export const finalizeCartItem = async (itemId: string): Promise<CartItem[]> => {
  await delay(100);
  const cart = getCart();
  const item = cart.find((it) => it.id === itemId);
  if (item) {
    item.finalized = true;
  }
  setInStorage(STORAGE_KEYS.cart, cart);
  return cart;
};

export const unfinalizeCartItem = async (itemId: string): Promise<CartItem[]> => {
  await delay(80);
  const cart = getCart();
  const item = cart.find((it) => it.id === itemId);
  if (item) {
    item.finalized = false;
  }
  setInStorage(STORAGE_KEYS.cart, cart);
  return cart;
};

// Sales API
export const createSale = async (
  cart: CartItem[],
  paymentMethod: string,
  installments?: number,
  discount?: number,
  payments?: { method: string; amount: number; installments?: number }[]
): Promise<Sale> => {
  try {
    const perms = getCurrentPermissions();
    if (!perms.includes('pos:checkout')) {
      throw new Error('Permissão negada: Realizar Vendas (pos:checkout)');
    }
    // Helper: aplica desconto global proporcionalmente
    const applyGlobalDiscount = (items: CartItem[], discountValue = 0) => {
      const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
      if (!subtotal || !discountValue) {
        return items.map((it) => ({
          productId: it.produto.id,
          qty: it.qtd,
          unitPrice: Number(it.produto.preco.toFixed(2)),
        }));
      }
      let remaining = Number((discountValue || 0).toFixed(2));
      const mapped = items.map((it, idx) => {
        const share = idx === items.length - 1
          ? remaining
          : Number(((it.subtotal / subtotal) * (discountValue || 0)).toFixed(2));
        remaining = Number((remaining - share).toFixed(2));
        const unit = Math.max((it.subtotal - share) / it.qtd, 0);
        return {
          productId: it.produto.id,
          qty: it.qtd,
          unitPrice: Number(unit.toFixed(2)),
        };
      });
      return mapped;
    };

    const currentSession = getCurrentSession();
    const operator = currentSession?.operador?.nome || 'Sistema';

    const pmLabel = payments && payments.length > 0
      ? payments.map(p => `${p.method} R$ ${p.amount.toFixed(2)}`).join(' + ')
      : paymentMethod;

    const payload = {
      operator,
      paymentMethod: pmLabel,
      items: applyGlobalDiscount(cart, discount || 0),
    } as any;

    const created = await apiCall<any>('/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const newSale: Sale = {
      id: created.id,
      code: created.code,
      operator: created.operator,
      paymentMethod: created.paymentMethod,
      status: created.status,
      total: created.total,
      customerId: created.customerId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      items: (created.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName ?? undefined,
        qty: it.qty,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        createdAt: it.createdAt,
      })),
    };

    if (payments && payments.length > 0) {
      saveSalePayments(newSale.id, payments);
      newSale.payments = payments.map(p => ({ method: p.method, amount: Number(p.amount.toFixed(2)), installments: p.installments }));
    }

    if (currentSession) {
      currentSession.vendasIds.push(newSale.id);
      setInStorage(STORAGE_KEYS.session, { ...currentSession });
    }

    await clearCart();

    return newSale;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const getSales = async (): Promise<Sale[]> => {
  try {
    const sales = await apiCall<any[]>('/sales');
    const map = getSalePaymentsMap();
    return (sales || []).map((s) => ({
      id: s.id,
      code: s.code,
      operator: s.operator,
      paymentMethod: s.paymentMethod,
      status: s.status,
      total: s.total,
      customerId: s.customerId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      items: (s.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName ?? undefined,
        qty: it.qty,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        createdAt: it.createdAt,
      })),
      payments: map[s.id] ? map[s.id].map((p: any) => ({ method: p.method, amount: Number(p.amount), installments: p.installments })) : undefined,
    }));
  } catch (error) {
    console.error('Error getting sales:', error);
    return [];
  }
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  try {
    const s = await apiCall<any>(`/sales/${id}`);
    if (!s) return null;
    const map = getSalePaymentsMap();
    return {
      id: s.id,
      code: s.code,
      operator: s.operator,
      paymentMethod: s.paymentMethod,
      status: s.status,
      total: s.total,
      customerId: s.customerId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      items: (s.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName ?? undefined,
        qty: it.qty,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        createdAt: it.createdAt,
      })),
      payments: map[s.id] ? map[s.id].map((p: any) => ({ method: p.method, amount: Number(p.amount), installments: p.installments })) : undefined,
    };
  } catch (error) {
    console.error('Error getting sale by id:', error);
    return null;
  }
};

// Session API (still uses localStorage for now - can be enhanced later)
export const getCurrentSession = (): Session | null => {
  return getFromStorage<Session | null>(STORAGE_KEYS.session, null);
};

export const createSession = async (operador: { id: string; nome: string }, saldoInicial: number): Promise<Session> => {
  await delay(300);
  const perms = getCurrentPermissions();
  if (!perms.includes('pos:open')) {
    throw new Error('Permissão negada: Abrir Caixa (pos:open)');
  }
  
  const session: Session = {
    id: Date.now().toString(),
    operador,
    abertoEm: new Date().toISOString(),
    saldoInicial,
    status: 'Aberto',
    cash: [],
    vendasIds: [],
  };

  setInStorage(STORAGE_KEYS.session, session);
  return session;
};

export const closeSession = async (resumoFechamento: Session['resumoFechamento']): Promise<Session> => {
  await delay(300);
  const perms = getCurrentPermissions();
  if (!perms.includes('pos:close')) {
    throw new Error('Permissão negada: Fechar Caixa (pos:close)');
  }
  
  const session = getCurrentSession();
  if (!session) {
    throw new Error('Nenhuma sessão ativa encontrada');
  }

  session.status = 'Fechado';
  session.fechadoEm = new Date().toISOString();
  session.resumoFechamento = resumoFechamento;

  // Move to closed sessions
  const closedSessions = getFromStorage<Session[]>(STORAGE_KEYS.sessionsClosed, []);
  closedSessions.push(session);
  setInStorage(STORAGE_KEYS.sessionsClosed, closedSessions);

  // Clear current session
  setInStorage(STORAGE_KEYS.session, null);

  return session;
};

export const addCashEntry = async (
  tipo: 'SANGRIA' | 'SUPRIMENTO',
  valor: number,
  descricao: string,
): Promise<Session> => {
  await delay(200);
  
  const session = getCurrentSession();
  if (!session) {
    throw new Error('Nenhuma sessão ativa encontrada');
  }

  const cashEntry: CashEntry = {
    id: Date.now().toString(),
    tipo,
    valor,
    descricao,
    timestamp: new Date().toISOString(),
  };

  session.cash.push(cashEntry);
  setInStorage(STORAGE_KEYS.session, session);

  return session;
};

export const getClosedSessions = async (): Promise<Session[]> => {
  await delay(200);
  return getFromStorage<Session[]>(STORAGE_KEYS.sessionsClosed, []);
};

// Discount functions
export const applyDiscount = (cart: CartItem[], couponCode: string): number => {
  // Simple coupon validation - in real app this would call an API
  const validCoupons: Record<string, number> = {
    'DESC10': 0.10,
    'DESC20': 0.20,
    'FIDELIDADE': 0.15,
    'PROMO5': 0.05,
  };

  const discountPercent = validCoupons[couponCode.toUpperCase()];
  if (!discountPercent) return 0;

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  return total * discountPercent;
};

export const applyItemDiscount = (item: CartItem, discountPercent: number): CartItem => {
  const discountAmount = item.subtotal * (discountPercent / 100);
  return {
    ...item,
    subtotal: item.subtotal - discountAmount,
  };
};

// Refund function
export const refundSale = async (saleId: string): Promise<void> => {
  const perms = getCurrentPermissions();
  if (!perms.includes('pos:refund') && !perms.includes('sales:refund')) {
    throw new Error('Permissão negada: Estornar Venda');
  }
  // Calls the local client API to process the refund and revert inventory
  await apiCall<any>(`/sales/${saleId}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};
