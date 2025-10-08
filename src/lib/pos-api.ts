/**
 * POS API - Real API Integration
 * Connects to client-local server for POS operations
 */

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
}

export interface SaleItem {
  id: string;
  productId: string;
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
const API_BASE_URL = 'http://127.0.0.1:3010';

// Storage keys for cart and session (still needed for frontend state)
const STORAGE_KEYS = {
  cart: '2f.pos.cart',
  session: '2f.pos.session.current',
  sessionsClosed: '2f.pos.sessions.closed',
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

// Products API
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const products = await apiCall<any[]>('/products');
    
    if (!query.trim()) {
      return products.map(p => ({
        id: p.id,
        nome: p.name,
        sku: p.sku,
        preco: p.salePrice || p.price,
        estoque: p.stockQty || 0,
        categoria: p.category,
        barcode: p.barcode,
      }));
    }
    
    const lowerQuery = query.toLowerCase();
    return products
      .filter(p => 
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.barcode?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
      )
      .map(p => ({
        id: p.id,
        nome: p.name,
        sku: p.sku,
        preco: p.salePrice || p.price,
        estoque: p.stockQty || 0,
        categoria: p.category,
        barcode: p.barcode,
      }));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

export const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const products = await apiCall<any[]>('/products');
    const product = products.find(p => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase());
    
    if (!product) return null;
    
    return {
      id: product.id,
      nome: product.name,
      sku: product.sku,
      preco: product.salePrice || product.price,
      estoque: product.stockQty || 0,
      categoria: product.category,
      barcode: product.barcode,
    };
  } catch (error) {
    console.error('Error finding product by barcode:', error);
    return null;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const products = await apiCall<any[]>('/products');
    return products.map(p => ({
      id: p.id,
      nome: p.name,
      sku: p.sku,
      preco: p.salePrice || p.price,
      estoque: p.stockQty || 0,
      categoria: p.category,
      barcode: p.barcode,
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const product = await apiCall<any>(`/products/${id}`);
    return {
      id: product.id,
      nome: product.name,
      sku: product.sku,
      preco: product.salePrice || product.price,
      estoque: product.stockQty || 0,
      categoria: product.category,
      barcode: product.barcode,
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
    existingItem.subtotal = existingItem.qtd * existingItem.produto.preco;
  } else {
    const newItem: CartItem = {
      id: Date.now().toString(),
      produto: product,
      qtd,
      subtotal: qtd * product.preco,
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
      item.subtotal = qtd * item.produto.preco;
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

// Sales API
export const createSale = async (saleData: {
  operator: string;
  paymentMethod: string;
  customerId?: string;
  items: { productId: string; qty: number; unitPrice: number }[];
}): Promise<Sale> => {
  try {
    // Get existing sales from localStorage
    const existingSales = getFromStorage<Sale[]>('2f.pos.sales', []);
    
    // Calculate total
    const total = saleData.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    
    // Create new sale
    const newSale: Sale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: `VND${String(existingSales.length + 1).padStart(6, '0')}`,
      operator: saleData.operator,
      paymentMethod: saleData.paymentMethod,
      status: 'completed',
      total,
      customerId: saleData.customerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: saleData.items.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,
        subtotal: item.qty * item.unitPrice,
        createdAt: new Date().toISOString(),
      })),
    };

    // Save to localStorage
    const updatedSales = [...existingSales, newSale];
    setInStorage('2f.pos.sales', updatedSales);

    // Clear cart after successful sale
    await clearCart();

    return newSale;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const getSales = async (): Promise<Sale[]> => {
  try {
    const sales = getFromStorage<Sale[]>('2f.pos.sales', []);
    return Array.isArray(sales) ? sales : [];
  } catch (error) {
    console.error('Error getting sales:', error);
    return [];
  }
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  try {
    const sales = getFromStorage<Sale[]>('2f.pos.sales', []);
    const sale = sales.find(s => s.id === id);
    return sale || null;
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

export const addCashEntry = async (entry: Omit<CashEntry, 'id' | 'timestamp'>): Promise<Session> => {
  await delay(200);
  
  const session = getCurrentSession();
  if (!session) {
    throw new Error('Nenhuma sessão ativa encontrada');
  }

  const cashEntry: CashEntry = {
    ...entry,
    id: Date.now().toString(),
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
  await delay(500);
  // In a real app, this would call the API to process the refund
  // For now, we'll just simulate the operation
  console.log(`Processing refund for sale ${saleId}`);
};
