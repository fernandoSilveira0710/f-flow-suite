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
  barcode?: string;
  imageUrl?: string;
}

export interface CartItem {
  productId: string;
  nome: string;
  sku: string;
  qtd: number;
  precoUnit: number;
  descontoItem: number;
  subtotal: number;
  imageUrl?: string;
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

export interface CashEntry {
  id: string;
  tipo: 'SANGRIA' | 'SUPRIMENTO';
  valor: number;
  obs?: string;
  dataISO: string;
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

const STORAGE_KEYS = {
  products: '2f.pos.products',
  cart: '2f.pos.cart',
  session: '2f.pos.session.current',
  sessionsClosed: '2f.pos.sessions.closed',
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
  { id: '1', nome: 'Ração Premium 15kg', sku: 'RAC001', preco: 189.90, estoque: 45, categoria: 'Ração', barcode: '7891234567890' },
  { id: '2', nome: 'Shampoo Pet 500ml', sku: 'SHP001', preco: 29.90, estoque: 120, categoria: 'Higiene', barcode: '7891234567891' },
  { id: '3', nome: 'Coleira Ajustável', sku: 'COL001', preco: 24.90, estoque: 80, categoria: 'Acessórios', barcode: '7891234567892' },
  { id: '4', nome: 'Brinquedo Mordedor', sku: 'BRI001', preco: 19.90, estoque: 150, categoria: 'Brinquedos', barcode: '7891234567893' },
  { id: '5', nome: 'Areia Sanitária 4kg', sku: 'ARE001', preco: 32.90, estoque: 60, categoria: 'Higiene', barcode: '7891234567894' },
  { id: '6', nome: 'Petiscos Variados', sku: 'PET001', preco: 15.90, estoque: 200, categoria: 'Petiscos', barcode: '7891234567895' },
  { id: '7', nome: 'Cama Confort M', sku: 'CAM001', preco: 79.90, estoque: 30, categoria: 'Camas', barcode: '7891234567896' },
  { id: '8', nome: 'Comedouro Duplo', sku: 'COM001', preco: 34.90, estoque: 50, categoria: 'Comedouros', barcode: '7891234567897' },
  { id: '9', nome: 'Antipulgas 3ml', sku: 'ANT001', preco: 45.90, estoque: 90, categoria: 'Medicamentos', barcode: '7891234567898' },
  { id: '10', nome: 'Osso Natural G', sku: 'OSS001', preco: 12.90, estoque: 180, categoria: 'Petiscos', barcode: '7891234567899' },
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
    p.barcode?.toLowerCase().includes(lowerQuery) ||
    p.categoria?.toLowerCase().includes(lowerQuery)
  );
};

export const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
  await delay(200);
  const products = getFromStorage<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  return products.find(p => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()) || null;
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
        ? { ...item, qtd: newQtd, subtotal: (newQtd * item.precoUnit) - item.descontoItem }
        : item
    );
  } else {
    const newItem: CartItem = {
      productId: product.id,
      nome: product.nome,
      sku: product.sku,
      qtd,
      precoUnit: product.preco,
      descontoItem: 0,
      subtotal: qtd * product.preco,
      imageUrl: product.imageUrl,
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
      ? { ...item, qtd, subtotal: (qtd * item.precoUnit) - item.descontoItem }
      : item
  );
  
  setInStorage(STORAGE_KEYS.cart, updatedCart);
  return updatedCart;
};

export const applyItemDiscount = async (productId: string, discount: number): Promise<CartItem[]> => {
  await delay(200);
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (!item) throw new Error('Item não encontrado no carrinho');
  
  const maxDiscount = item.qtd * item.precoUnit;
  if (discount < 0 || discount > maxDiscount) {
    throw new Error('Desconto inválido');
  }
  
  const updatedCart = cart.map(i =>
    i.productId === productId
      ? { ...i, descontoItem: discount, subtotal: (i.qtd * i.precoUnit) - discount }
      : i
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

export const openSession = async (
  saldoInicial: number,
  operador: { id: string; nome: string }
): Promise<Session> => {
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
    operador,
    cash: [],
    vendasIds: [],
  };
  
  setInStorage(STORAGE_KEYS.session, newSession);
  return newSession;
};

export const addCashEntry = async (
  tipo: 'SANGRIA' | 'SUPRIMENTO',
  valor: number,
  obs?: string
): Promise<Session> => {
  await delay(300);
  const session = getSession();
  if (!session || session.status !== 'Aberto') {
    throw new Error('Nenhuma sessão aberta');
  }

  const entry: CashEntry = {
    id: `CASH-${Date.now()}`,
    tipo,
    valor,
    obs,
    dataISO: new Date().toISOString(),
  };

  const updatedSession: Session = {
    ...session,
    cash: [...session.cash, entry],
  };

  setInStorage(STORAGE_KEYS.session, updatedSession);
  return updatedSession;
};

export const closeSession = async (observacao?: string): Promise<Session> => {
  await delay(500);
  const session = getSession();
  if (!session || session.status === 'Fechado') {
    throw new Error('Nenhuma sessão aberta');
  }

  // Calculate resumo
  const sales = getFromStorage<Sale[]>(STORAGE_KEYS.sales, []);
  const sessionSales = sales.filter(s => session.vendasIds.includes(s.id) && s.status === 'Pago');

  const totalVendas = sessionSales.reduce((sum, s) => sum + s.total, 0);
  const totalDinheiro = sessionSales
    .filter(s => s.pagamento === 'Dinheiro')
    .reduce((sum, s) => sum + s.total, 0);
  const totalCartao = sessionSales
    .filter(s => s.pagamento.includes('Cartão'))
    .reduce((sum, s) => sum + s.total, 0);
  const totalPix = sessionSales
    .filter(s => s.pagamento === 'PIX')
    .reduce((sum, s) => sum + s.total, 0);
  const totalOutros = sessionSales
    .filter(s => !['Dinheiro', 'PIX'].includes(s.pagamento) && !s.pagamento.includes('Cartão'))
    .reduce((sum, s) => sum + s.total, 0);

  const totalSangria = session.cash
    .filter(c => c.tipo === 'SANGRIA')
    .reduce((sum, c) => sum + c.valor, 0);
  const totalSuprimento = session.cash
    .filter(c => c.tipo === 'SUPRIMENTO')
    .reduce((sum, c) => sum + c.valor, 0);

  const saldoFinalCalculado =
    session.saldoInicial + totalSuprimento - totalSangria + totalDinheiro;

  const closedSession: Session = {
    ...session,
    fechadoEm: new Date().toISOString(),
    status: 'Fechado',
    resumoFechamento: {
      totalVendas,
      totalDinheiro,
      totalCartao,
      totalPix,
      totalOutros,
      totalSangria,
      totalSuprimento,
      saldoFinalCalculado,
      observacao,
    },
  };

  // Save to closed sessions
  const closedSessions = getFromStorage<Session[]>(STORAGE_KEYS.sessionsClosed, []);
  setInStorage(STORAGE_KEYS.sessionsClosed, [closedSession, ...closedSessions]);

  // Clear current session
  setInStorage(STORAGE_KEYS.session, null);

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
    operador: session.operador.nome,
  };
  
  // Save sale
  const sales = await getSales();
  const updatedSales = [newSale, ...sales];
  setInStorage(STORAGE_KEYS.sales, updatedSales);
  
  // Update session
  const updatedSession: Session = {
    ...session,
    vendasIds: [...session.vendasIds, newSale.id],
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

export const refundSale = async (saleId: string): Promise<Sale> => {
  await delay(500);
  const sales = await getSales();
  const sale = sales.find(s => s.id === saleId);
  if (!sale) throw new Error('Venda não encontrada');
  if (sale.status === 'Cancelado') throw new Error('Venda já cancelada');
  
  // Update sale status
  const updatedSale = { ...sale, status: 'Cancelado' as const };
  const updatedSales = sales.map(s => s.id === saleId ? updatedSale : s);
  setInStorage(STORAGE_KEYS.sales, updatedSales);
  
  // Restore product stock
  const products = getFromStorage<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  const updatedProducts = products.map(product => {
    const cartItem = sale.itens.find(item => item.productId === product.id);
    if (cartItem) {
      return { ...product, estoque: product.estoque + cartItem.qtd };
    }
    return product;
  });
  setInStorage(STORAGE_KEYS.products, updatedProducts);
  
  return updatedSale;
};
