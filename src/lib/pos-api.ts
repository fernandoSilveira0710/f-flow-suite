/**
 * API Mock para PDV (Ponto de Venda)
 * Futuramente apontará para 2F License Hub via VITE_LICENSE_HUB_URL
 */

export interface Product {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  estoque: number;
  categoria?: string;
}

export interface CartItem {
  productId: string;
  nome: string;
  sku: string;
  qtd: number;
  precoUnit: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  data: string;
  itens: CartItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pagamento: string;
  parcelas?: number;
  status: 'Pago' | 'Cancelado';
  operador: string;
}

export interface Session {
  id: string;
  abertoEm: string;
  fechadoEm?: string;
  saldoInicial: number;
  saldoFinal?: number;
  status: 'Aberto' | 'Fechado';
  operador: string;
  vendas: number;
  totalVendas: number;
}

const STORAGE_KEYS = {
  products: '2f.pos.products',
  cart: '2f.pos.cart',
  session: '2f.pos.session',
  sales: '2f.pos.sales',
};

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

// Mock Products
const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', nome: 'Ração Premium 15kg', sku: 'RAC001', preco: 189.90, estoque: 45, categoria: 'Ração' },
  { id: '2', nome: 'Shampoo Pet 500ml', sku: 'SHP001', preco: 29.90, estoque: 120, categoria: 'Higiene' },
  { id: '3', nome: 'Coleira Ajustável', sku: 'COL001', preco: 24.90, estoque: 80, categoria: 'Acessórios' },
  { id: '4', nome: 'Brinquedo Mordedor', sku: 'BRI001', preco: 19.90, estoque: 150, categoria: 'Brinquedos' },
  { id: '5', nome: 'Areia Sanitária 4kg', sku: 'ARE001', preco: 32.90, estoque: 60, categoria: 'Higiene' },
  { id: '6', nome: 'Petiscos Variados', sku: 'PET001', preco: 15.90, estoque: 200, categoria: 'Petiscos' },
  { id: '7', nome: 'Cama Confort M', sku: 'CAM001', preco: 79.90, estoque: 30, categoria: 'Camas' },
  { id: '8', nome: 'Comedouro Duplo', sku: 'COM001', preco: 34.90, estoque: 50, categoria: 'Comedouros' },
  { id: '9', nome: 'Antipulgas 3ml', sku: 'ANT001', preco: 45.90, estoque: 90, categoria: 'Medicamentos' },
  { id: '10', nome: 'Osso Natural G', sku: 'OSS001', preco: 12.90, estoque: 180, categoria: 'Petiscos' },
];

// Initialize products if not exists
if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEYS.products)) {
  setInStorage(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
}

// Products API
export const searchProducts = async (query: string): Promise<Product[]> => {
  await delay(300);
  const products = getFromStorage<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  
  if (!query.trim()) return products;
  
  const lowerQuery = query.toLowerCase();
  return products.filter(p => 
    p.nome.toLowerCase().includes(lowerQuery) ||
    p.sku.toLowerCase().includes(lowerQuery) ||
    p.categoria?.toLowerCase().includes(lowerQuery)
  );
};

export const getProducts = async (): Promise<Product[]> => {
  await delay(300);
  return getFromStorage<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  await delay(200);
  const products = getFromStorage<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  return products.find(p => p.id === id) || null;
};

// Cart API
export const getCart = (): CartItem[] => {
  return getFromStorage<CartItem[]>(STORAGE_KEYS.cart, []);
};

export const addToCart = async (productId: string, qtd: number = 1): Promise<CartItem[]> => {
  await delay(200);
  const product = await getProductById(productId);
  if (!product) throw new Error('Produto não encontrado');
  
  if (product.estoque < qtd) {
    throw new Error('Estoque insuficiente');
  }
  
  const cart = getCart();
  const existingItem = cart.find(item => item.productId === productId);
  
  let updatedCart: CartItem[];
  if (existingItem) {
    const newQtd = existingItem.qtd + qtd;
    if (newQtd > product.estoque) {
      throw new Error('Estoque insuficiente');
    }
    updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, qtd: newQtd, subtotal: newQtd * item.precoUnit }
        : item
    );
  } else {
    const newItem: CartItem = {
      productId: product.id,
      nome: product.nome,
      sku: product.sku,
      qtd,
      precoUnit: product.preco,
      subtotal: qtd * product.preco,
    };
    updatedCart = [...cart, newItem];
  }
  
  setInStorage(STORAGE_KEYS.cart, updatedCart);
  return updatedCart;
};

export const updateCartItem = async (productId: string, qtd: number): Promise<CartItem[]> => {
  await delay(200);
  const product = await getProductById(productId);
  if (!product) throw new Error('Produto não encontrado');
  
  if (qtd < 1) throw new Error('Quantidade inválida');
  if (qtd > product.estoque) throw new Error('Estoque insuficiente');
  
  const cart = getCart();
  const updatedCart = cart.map(item =>
    item.productId === productId
      ? { ...item, qtd, subtotal: qtd * item.precoUnit }
      : item
  );
  
  setInStorage(STORAGE_KEYS.cart, updatedCart);
  return updatedCart;
};

export const removeFromCart = async (productId: string): Promise<CartItem[]> => {
  await delay(200);
  const cart = getCart();
  const updatedCart = cart.filter(item => item.productId !== productId);
  setInStorage(STORAGE_KEYS.cart, updatedCart);
  return updatedCart;
};

export const clearCart = (): void => {
  setInStorage(STORAGE_KEYS.cart, []);
};

export const applyDiscount = (cart: CartItem[], couponCode: string): number => {
  // Mock: apenas o cupom "PROMO10" aplica 10% de desconto
  if (couponCode.toUpperCase() === 'PROMO10') {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal * 0.1;
  }
  return 0;
};

// Session API
export const getSession = (): Session | null => {
  return getFromStorage<Session | null>(STORAGE_KEYS.session, null);
};

export const openSession = async (saldoInicial: number): Promise<Session> => {
  await delay(500);
  const existingSession = getSession();
  if (existingSession?.status === 'Aberto') {
    throw new Error('Já existe uma sessão aberta');
  }
  
  const newSession: Session = {
    id: `SES-${Date.now()}`,
    abertoEm: new Date().toISOString(),
    saldoInicial,
    status: 'Aberto',
    operador: 'Admin Demo',
    vendas: 0,
    totalVendas: 0,
  };
  
  setInStorage(STORAGE_KEYS.session, newSession);
  return newSession;
};

export const closeSession = async (): Promise<Session> => {
  await delay(500);
  const session = getSession();
  if (!session || session.status === 'Fechado') {
    throw new Error('Nenhuma sessão aberta');
  }
  
  const closedSession: Session = {
    ...session,
    fechadoEm: new Date().toISOString(),
    saldoFinal: session.saldoInicial + session.totalVendas,
    status: 'Fechado',
  };
  
  setInStorage(STORAGE_KEYS.session, closedSession);
  return closedSession;
};

// Sales API
export const getSales = async (): Promise<Sale[]> => {
  await delay(300);
  return getFromStorage<Sale[]>(STORAGE_KEYS.sales, []);
};

export const createSale = async (
  cart: CartItem[],
  pagamento: string,
  parcelas?: number,
  desconto: number = 0
): Promise<Sale> => {
  await delay(500);
  
  const session = getSession();
  if (!session || session.status !== 'Aberto') {
    throw new Error('Nenhuma sessão aberta');
  }
  
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - desconto;
  
  const newSale: Sale = {
    id: `VND-${Date.now()}`,
    data: new Date().toISOString(),
    itens: cart,
    subtotal,
    desconto,
    total,
    pagamento,
    parcelas,
    status: 'Pago',
    operador: session.operador,
  };
  
  // Save sale
  const sales = await getSales();
  const updatedSales = [newSale, ...sales];
  setInStorage(STORAGE_KEYS.sales, updatedSales);
  
  // Update session
  const updatedSession: Session = {
    ...session,
    vendas: session.vendas + 1,
    totalVendas: session.totalVendas + total,
  };
  setInStorage(STORAGE_KEYS.session, updatedSession);
  
  // Update product stock
  const products = getFromStorage<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  const updatedProducts = products.map(product => {
    const cartItem = cart.find(item => item.productId === product.id);
    if (cartItem) {
      return { ...product, estoque: product.estoque - cartItem.qtd };
    }
    return product;
  });
  setInStorage(STORAGE_KEYS.products, updatedProducts);
  
  // Clear cart
  clearCart();
  
  return newSale;
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  await delay(200);
  const sales = await getSales();
  return sales.find(s => s.id === id) || null;
};
