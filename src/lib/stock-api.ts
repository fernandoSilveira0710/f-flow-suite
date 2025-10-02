/**
 * Stock Management Mock API
 * Persistência via localStorage
 */

// Types
export type UnidadeMedida = 'UN' | 'KG' | 'L' | 'CX';
export type TipoMovimento = 'ENTRADA' | 'SAIDA' | 'AJUSTE';
export type OrigemMovimento = 'COMPRA' | 'VENDA' | 'PERDA' | 'TRANSFERENCIA' | 'INVENTARIO';
export type StatusPO = 'RASCUNHO' | 'EM_ABERTO' | 'RECEBIDO' | 'CANCELADO';
export type TipoInventario = 'CEGA' | 'PARCIAL';
export type StatusInventario = 'ABERTA' | 'EM_CONTAGEM' | 'FINALIZADA' | 'CANCELADA';

export interface Product {
  id: string;
  nome: string;
  sku: string;
  categoria?: string;
  unidade: UnidadeMedida;
  precoCusto?: number;
  precoVenda?: number;
  estoqueAtual: number;
  estoqueMinimo?: number;
  validade?: string;
  barcode?: string;
}

export interface StockMovement {
  id: string;
  data: string;
  tipo: TipoMovimento;
  produtoId: string;
  sku: string;
  nomeProduto: string;
  quantidade: number;
  custoUnit?: number;
  origem?: OrigemMovimento;
  motivo?: string;
  documento?: string;
  observacao?: string;
  usuario?: string;
}

export interface Supplier {
  id: string;
  nome: string;
  cnpjCpf?: string;
  email?: string;
  telefone?: string;
  endereco?: {
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  ativo: boolean;
}

export interface PurchaseOrderItem {
  produtoId: string;
  sku: string;
  nome: string;
  qtd: number;
  custoUnit: number;
}

export interface PurchaseOrder {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  status: StatusPO;
  criadoEm: string;
  atualizadoEm: string;
  itens: PurchaseOrderItem[];
  total: number;
  previsaoEntrega?: string;
  numero?: string;
}

export interface InventoryCountItem {
  produtoId: string;
  sku: string;
  nome: string;
  contagem?: number;
  sistemaNaAbertura: number;
}

export interface InventoryCount {
  id: string;
  tipo: TipoInventario;
  status: StatusInventario;
  criadoEm: string;
  finalizadaEm?: string;
  itens: InventoryCountItem[];
  observacao?: string;
}

export interface StockPrefs {
  estoqueMinimoPadrao?: number;
  bloquearVendaSemEstoque?: boolean;
  habilitarCodigoBarras?: boolean;
  considerarValidade?: boolean;
}

export interface StockAlert {
  tipo: 'RUPTURA' | 'ABAIXO_MINIMO' | 'VALIDADE_PROXIMA';
  produto: Product;
  mensagem: string;
}

// Storage keys
const KEYS = {
  PRODUCTS: '2f.stock.products',
  MOVEMENTS: '2f.stock.movements',
  SUPPLIERS: '2f.stock.suppliers',
  PURCHASE_ORDERS: '2f.stock.purchaseOrders',
  INVENTORY_COUNTS: '2f.stock.inventoryCounts',
  PREFS: '2f.stock.prefs',
};

// Helper: UUID v4
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Storage helpers
function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize mock data
function initMockData() {
  const products = getStorage<Product[]>(KEYS.PRODUCTS, []);
  if (products.length === 0) {
    const mockProducts: Product[] = [
      {
        id: uuid(),
        nome: 'Ração Premium 15kg',
        sku: 'RAC-PREM-15',
        categoria: 'Alimentação',
        unidade: 'UN',
        precoCusto: 120,
        precoVenda: 180,
        estoqueAtual: 25,
        estoqueMinimo: 10,
        barcode: '7891234567890',
      },
      {
        id: uuid(),
        nome: 'Shampoo Pet 500ml',
        sku: 'SHP-PET-500',
        categoria: 'Higiene',
        unidade: 'UN',
        precoCusto: 15,
        precoVenda: 25,
        estoqueAtual: 5,
        estoqueMinimo: 15,
        validade: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        barcode: '7891234567891',
      },
      {
        id: uuid(),
        nome: 'Coleira M',
        sku: 'COL-M-01',
        categoria: 'Acessórios',
        unidade: 'UN',
        precoCusto: 8,
        precoVenda: 15,
        estoqueAtual: 0,
        estoqueMinimo: 5,
      },
    ];
    setStorage(KEYS.PRODUCTS, mockProducts);
  }

  const suppliers = getStorage<Supplier[]>(KEYS.SUPPLIERS, []);
  if (suppliers.length === 0) {
    const mockSuppliers: Supplier[] = [
      {
        id: uuid(),
        nome: 'Pet Distribuidora Ltda',
        cnpjCpf: '12.345.678/0001-90',
        email: 'vendas@petdistribuidora.com',
        telefone: '(11) 98765-4321',
        endereco: { cidade: 'São Paulo', uf: 'SP', cep: '01234-567' },
        ativo: true,
      },
    ];
    setStorage(KEYS.SUPPLIERS, mockSuppliers);
  }
}

// API Functions

// Products
export function getProducts(): Product[] {
  initMockData();
  return getStorage<Product[]>(KEYS.PRODUCTS, []);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function updateProduct(id: string, updates: Partial<Product>): Product {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Produto não encontrado');
  products[index] = { ...products[index], ...updates };
  setStorage(KEYS.PRODUCTS, products);
  return products[index];
}

// Movements
export function getMovements(): StockMovement[] {
  return getStorage<StockMovement[]>(KEYS.MOVEMENTS, []);
}

export function createMovement(data: Omit<StockMovement, 'id' | 'data' | 'nomeProduto'>): StockMovement {
  const movements = getMovements();
  const product = getProductById(data.produtoId);
  if (!product) throw new Error('Produto não encontrado');

  const movement: StockMovement = {
    id: uuid(),
    data: new Date().toISOString(),
    nomeProduto: product.nome,
    ...data,
  };

  movements.unshift(movement);
  setStorage(KEYS.MOVEMENTS, movements);

  // Update product stock
  let newStock = product.estoqueAtual;
  if (data.tipo === 'ENTRADA') {
    newStock += data.quantidade;
  } else if (data.tipo === 'SAIDA') {
    newStock -= data.quantidade;
  } else if (data.tipo === 'AJUSTE') {
    newStock = data.quantidade;
  }

  updateProduct(product.id, { estoqueAtual: Math.max(0, newStock) });

  return movement;
}

// Suppliers
export function getSuppliers(): Supplier[] {
  initMockData();
  return getStorage<Supplier[]>(KEYS.SUPPLIERS, []);
}

export function getSupplierById(id: string): Supplier | undefined {
  return getSuppliers().find((s) => s.id === id);
}

export function createSupplier(data: Omit<Supplier, 'id'>): Supplier {
  const suppliers = getSuppliers();
  const supplier: Supplier = { id: uuid(), ...data };
  suppliers.push(supplier);
  setStorage(KEYS.SUPPLIERS, suppliers);
  return supplier;
}

export function updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
  const suppliers = getSuppliers();
  const index = suppliers.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('Fornecedor não encontrado');
  suppliers[index] = { ...suppliers[index], ...updates };
  setStorage(KEYS.SUPPLIERS, suppliers);
  return suppliers[index];
}

export function toggleSupplierStatus(id: string): Supplier {
  const supplier = getSupplierById(id);
  if (!supplier) throw new Error('Fornecedor não encontrado');
  return updateSupplier(id, { ativo: !supplier.ativo });
}

// Purchase Orders
export function getPurchaseOrders(): PurchaseOrder[] {
  return getStorage<PurchaseOrder[]>(KEYS.PURCHASE_ORDERS, []);
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return getPurchaseOrders().find((po) => po.id === id);
}

export function createPurchaseOrder(data: {
  fornecedorId: string;
  itens: PurchaseOrderItem[];
  previsaoEntrega?: string;
  numero?: string;
}): PurchaseOrder {
  const supplier = getSupplierById(data.fornecedorId);
  if (!supplier) throw new Error('Fornecedor não encontrado');

  const total = data.itens.reduce((sum, item) => sum + item.qtd * item.custoUnit, 0);
  const now = new Date().toISOString();

  const po: PurchaseOrder = {
    id: uuid(),
    fornecedorId: data.fornecedorId,
    fornecedorNome: supplier.nome,
    status: 'RASCUNHO',
    criadoEm: now,
    atualizadoEm: now,
    itens: data.itens,
    total,
    previsaoEntrega: data.previsaoEntrega,
    numero: data.numero,
  };

  const orders = getPurchaseOrders();
  orders.unshift(po);
  setStorage(KEYS.PURCHASE_ORDERS, orders);
  return po;
}

export function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): PurchaseOrder {
  const orders = getPurchaseOrders();
  const index = orders.findIndex((po) => po.id === id);
  if (index === -1) throw new Error('Pedido não encontrado');

  const updated = {
    ...orders[index],
    ...updates,
    atualizadoEm: new Date().toISOString(),
  };

  if (updates.itens) {
    updated.total = updates.itens.reduce((sum, item) => sum + item.qtd * item.custoUnit, 0);
  }

  orders[index] = updated;
  setStorage(KEYS.PURCHASE_ORDERS, orders);
  return updated;
}

export function receivePurchaseOrder(id: string, receivedItems: { produtoId: string; qtd: number }[]): PurchaseOrder {
  const po = getPurchaseOrderById(id);
  if (!po) throw new Error('Pedido não encontrado');
  if (po.status === 'RECEBIDO') throw new Error('Pedido já foi recebido');

  // Create movements for each received item
  receivedItems.forEach((received) => {
    const item = po.itens.find((i) => i.produtoId === received.produtoId);
    if (!item) return;

    createMovement({
      tipo: 'ENTRADA',
      produtoId: received.produtoId,
      sku: item.sku,
      quantidade: received.qtd,
      custoUnit: item.custoUnit,
      origem: 'COMPRA',
      documento: `PO-${po.numero || po.id}`,
      observacao: `Recebimento PO ${po.numero || po.id}`,
    });
  });

  return updatePurchaseOrder(id, { status: 'RECEBIDO' });
}

// Inventory Counts
export function getInventoryCounts(): InventoryCount[] {
  return getStorage<InventoryCount[]>(KEYS.INVENTORY_COUNTS, []);
}

export function getInventoryCountById(id: string): InventoryCount | undefined {
  return getInventoryCounts().find((ic) => ic.id === id);
}

export function createInventoryCount(data: {
  tipo: TipoInventario;
  produtosIds?: string[];
  observacao?: string;
}): InventoryCount {
  const allProducts = getProducts();
  const products = data.produtosIds
    ? allProducts.filter((p) => data.produtosIds!.includes(p.id))
    : allProducts;

  const itens: InventoryCountItem[] = products.map((p) => ({
    produtoId: p.id,
    sku: p.sku,
    nome: p.nome,
    sistemaNaAbertura: p.estoqueAtual,
  }));

  const count: InventoryCount = {
    id: uuid(),
    tipo: data.tipo,
    status: 'ABERTA',
    criadoEm: new Date().toISOString(),
    itens,
    observacao: data.observacao,
  };

  const counts = getInventoryCounts();
  counts.unshift(count);
  setStorage(KEYS.INVENTORY_COUNTS, counts);
  return count;
}

export function updateInventoryCount(id: string, updates: Partial<InventoryCount>): InventoryCount {
  const counts = getInventoryCounts();
  const index = counts.findIndex((ic) => ic.id === id);
  if (index === -1) throw new Error('Inventário não encontrado');
  counts[index] = { ...counts[index], ...updates };
  setStorage(KEYS.INVENTORY_COUNTS, counts);
  return counts[index];
}

export function finalizeInventoryCount(id: string): InventoryCount {
  const count = getInventoryCountById(id);
  if (!count) throw new Error('Inventário não encontrado');
  if (count.status === 'FINALIZADA') throw new Error('Inventário já finalizado');

  // Generate adjustments
  count.itens.forEach((item) => {
    if (item.contagem === undefined) return;
    const diff = item.contagem - item.sistemaNaAbertura;
    if (diff === 0) return;

    createMovement({
      tipo: 'AJUSTE',
      produtoId: item.produtoId,
      sku: item.sku,
      quantidade: item.contagem,
      origem: 'INVENTARIO',
      documento: `INV-${id}`,
      observacao: `Inventário ${count.tipo} - Ajuste: ${diff > 0 ? '+' : ''}${diff}`,
    });
  });

  return updateInventoryCount(id, {
    status: 'FINALIZADA',
    finalizadaEm: new Date().toISOString(),
  });
}

// Preferences
export function getStockPrefs(): StockPrefs {
  return getStorage<StockPrefs>(KEYS.PREFS, {
    estoqueMinimoPadrao: 10,
    bloquearVendaSemEstoque: true,
    habilitarCodigoBarras: true,
    considerarValidade: true,
  });
}

export function saveStockPrefs(prefs: StockPrefs): StockPrefs {
  setStorage(KEYS.PREFS, prefs);
  return prefs;
}

// Alerts
export function getStockAlerts(): StockAlert[] {
  const products = getProducts();
  const prefs = getStockPrefs();
  const alerts: StockAlert[] = [];

  products.forEach((product) => {
    // Ruptura
    if (product.estoqueAtual <= 0) {
      alerts.push({
        tipo: 'RUPTURA',
        produto: product,
        mensagem: 'Produto sem estoque',
      });
    }
    // Abaixo do mínimo
    else if (product.estoqueAtual < (product.estoqueMinimo || prefs.estoqueMinimoPadrao || 0)) {
      alerts.push({
        tipo: 'ABAIXO_MINIMO',
        produto: product,
        mensagem: `Estoque abaixo do mínimo (${product.estoqueMinimo || prefs.estoqueMinimoPadrao})`,
      });
    }

    // Validade próxima (30 dias)
    if (prefs.considerarValidade && product.validade) {
      const validadeDate = new Date(product.validade);
      const diffDays = Math.ceil((validadeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 30) {
        alerts.push({
          tipo: 'VALIDADE_PROXIMA',
          produto: product,
          mensagem: `Validade em ${diffDays} dia(s)`,
        });
      }
    }
  });

  return alerts;
}
