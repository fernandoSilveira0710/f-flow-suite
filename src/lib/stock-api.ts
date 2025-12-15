// Import mockAPI to use the same products data
import { mockAPI, type Product as MockProduct } from './mock-data';
import { API_URLS } from './env';
import { apiClient, getTenantId } from './api-client';

/**
 * Stock/Inventory API - Real API Integration
 * Connects to client-local server for inventory operations
 */

export interface StockMovement {
  id: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  produtoId: string;
  produtoNome: string;
  sku: string;
  quantidade: number;
  custoUnit?: number;
  valorTotal?: number;
  origem: string;
  motivo?: string;
  documento?: string;
  data: string;
  usuario: string;
  observacao?: string;
}

export interface CreateMovementDto {
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  produtoId: string;
  sku: string;
  quantidade: number;
  custoUnit?: number;
  origem: string;
  motivo?: string;
  documento?: string;
  observacao?: string;
  estoqueMinimo?: number;
}

// Types and Interfaces
export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  lastUpdated: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

// Ajuste de estoque (shape compatível com client-local)
export interface AdjustInventoryItemDto {
  productId: string;
  delta: number; // positivo para entrada, negativo para saída
  reason: string;
  notes?: string;
  document?: string;
  unitCost?: number;
}

export interface BulkAdjustInventoryDto {
  adjustments: AdjustInventoryItemDto[];
}

// API Configuration
const API_BASE_URL = API_URLS.CLIENT_LOCAL;

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

// Stock/Inventory API
export const getStockLevels = async (): Promise<StockItem[]> => {
  try {
    const inventory = await apiCall<any[]>('/inventory');
    
    return inventory.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || 'Unknown Product',
      productSku: item.product?.sku || '',
      currentStock: item.currentStock,
      minStock: item.product?.minStock || 0,
      maxStock: item.product?.maxStock || 0,
      unit: item.product?.unit || 'un',
      lastUpdated: item.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return [];
  }
};

export const getStockByProductId = async (productId: string): Promise<StockItem | null> => {
  try {
    const inventory = await apiCall<any>(`/inventory/${productId}`);
    
    return {
      id: inventory.id,
      productId: inventory.productId,
      productName: inventory.product?.name || 'Unknown Product',
      productSku: inventory.product?.sku || '',
      currentStock: inventory.currentStock,
      minStock: inventory.product?.minStock || 0,
      maxStock: inventory.product?.maxStock || 0,
      unit: inventory.product?.unit || 'un',
      lastUpdated: inventory.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching stock by product id:', error);
    return null;
  }
};

export const adjustStock = async (adjustment: AdjustInventoryItemDto): Promise<StockAdjustment> => {
  try {
    const result = await apiCall<any>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        adjustments: [adjustment]
      }),
    });
    
    // Return the first adjustment from the result
    const adjustmentResult = result.adjustments[0];
    
    return {
      id: adjustmentResult.id,
      productId: adjustmentResult.productId,
      type: adjustmentResult.delta >= 0 ? 'IN' : 'OUT',
      quantity: Math.abs(adjustmentResult.delta),
      reason: adjustmentResult.reason,
      notes: adjustmentResult.notes,
      createdAt: adjustmentResult.createdAt,
      createdBy: adjustmentResult.createdBy || 'System',
    };
  } catch (error) {
    console.error('Error adjusting stock:', error);
    throw error;
  }
};

export const bulkAdjustStock = async (bulkAdjustment: BulkAdjustInventoryDto): Promise<StockAdjustment[]> => {
  try {
    const result = await apiCall<any>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(bulkAdjustment),
    });
    
    return result.adjustments.map((adj: any) => ({
      id: adj.id,
      productId: adj.productId,
      type: adj.delta >= 0 ? 'IN' : 'OUT',
      quantity: Math.abs(adj.delta),
      reason: adj.reason,
      notes: adj.notes,
      createdAt: adj.createdAt,
      createdBy: adj.createdBy || 'System',
    }));
  } catch (error) {
    console.error('Error bulk adjusting stock:', error);
    throw error;
  }
};

export const getLowStockItems = async (): Promise<StockItem[]> => {
  try {
    const stockLevels = await getStockLevels();
    
    return stockLevels.filter(item => 
      item.currentStock <= item.minStock && item.minStock > 0
    );
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return [];
  }
};

export const getStockMovements = async (productId?: string): Promise<StockMovement[]> => {
  try {
    const endpoint = productId
      ? `/inventory/adjustments/product/${productId}`
      : `/inventory/adjustments`;

    type LocalAdjustment = {
      id: string;
      productId: string;
      delta: number;
      reason: string;
      notes?: string;
      document?: string;
      unitCost?: number;
      createdAt: string;
      // Campos extras do backend local
      productName?: string;
      productSku?: string;
    };

    const adjustments = await apiCall<LocalAdjustment[]>(endpoint, { method: 'GET' });

    return adjustments.map((adj) => {
      let tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
      const reasonUpper = (adj.reason || '').toUpperCase();
      if (['AJUSTE', 'ADJUSTMENT', 'INVENTARIO', 'INVENTORY'].includes(reasonUpper)) {
        tipo = 'AJUSTE';
      } else if (adj.delta > 0) {
        tipo = 'ENTRADA';
      } else {
        tipo = 'SAIDA';
      }

      const quantidade = Math.abs(adj.delta || 0);

      return {
        id: adj.id,
        tipo,
        produtoId: adj.productId,
        produtoNome: adj.productName || '',
        sku: adj.productSku || '',
        quantidade,
        origem: tipo === 'ENTRADA' ? 'COMPRA' : tipo === 'SAIDA' ? 'VENDA' : 'INVENTARIO',
        motivo: adj.reason || undefined,
        documento: adj.document || undefined,
        observacao: adj.notes || undefined,
        data: adj.createdAt,
        usuario: 'Sistema',
        custoUnit: adj.unitCost,
        valorTotal: adj.unitCost ? adj.unitCost * quantidade : undefined,
      } as StockMovement;
    });
  } catch (error) {
    console.error('Error fetching stock movements from client-local:', error);
    return [];
  }
};

// Mock data and functions for frontend compatibility
const mockMovements: StockMovement[] = [];

export const getMovements = (): StockMovement[] => {
  return mockMovements;
};

export const createMovement = (data: CreateMovementDto): StockMovement => {
  // Atualizar o estoque do produto no mockAPI
  const product = mockAPI.getProduct(data.produtoId);
  if (!product) {
    throw new Error('Produto não encontrado');
  }

  let newStock = product.stock;
  let quantidadeMovimento = data.quantidade || 0;
  
  if (data.tipo === 'ENTRADA') {
    newStock += data.quantidade || 0;
  } else if (data.tipo === 'SAIDA') {
    newStock -= data.quantidade || 0;
  } else if (data.tipo === 'AJUSTE') {
    // Para ajuste, só alterar o estoque se quantidade foi fornecida
    if (data.quantidade !== undefined) {
      newStock = data.quantidade; // Para ajuste, a quantidade é o novo saldo
    }
    // Se não foi fornecida quantidade, manter o estoque atual
    quantidadeMovimento = newStock; // Para o registro do movimento
  }
  
  // Garantir que o estoque não fique negativo
  newStock = Math.max(0, newStock);
  
  // Atualizar o produto no mockAPI
  const updatedProduct = {
    ...product,
    stock: newStock,
    minStock: data.estoqueMinimo !== undefined ? data.estoqueMinimo : product.minStock
  };
  
  mockAPI.updateProduct(data.produtoId, updatedProduct);
  
  // Salvar no localStorage para persistência
  const products = mockAPI.getProducts();
  localStorage.setItem('mock_products', JSON.stringify(products));

  const movement: StockMovement = {
    id: Date.now().toString(),
    tipo: data.tipo,
    produtoId: data.produtoId,
    produtoNome: product.name,
    sku: data.sku,
    quantidade: quantidadeMovimento,
    custoUnit: data.custoUnit,
    valorTotal: data.custoUnit && quantidadeMovimento ? data.custoUnit * quantidadeMovimento : undefined,
    origem: data.origem,
    motivo: data.motivo,
    documento: data.documento,
    data: new Date().toISOString(),
    usuario: 'Admin Demo',
  };

  mockMovements.unshift(movement);
  
  // Salvar movimentos no localStorage
  localStorage.setItem('stock_movements', JSON.stringify(mockMovements));
  
  return movement;
};

export interface StockPrefs {
  alertaEstoqueBaixo: boolean;
  limiteMinimo: number;
  controlarLotes: boolean;
  controlarValidade: boolean;
  estoqueMinimoPadrao?: number;
  bloquearVendaSemEstoque?: boolean;
}

const mockStockPrefs: StockPrefs = {
  alertaEstoqueBaixo: true,
  limiteMinimo: 5,
  controlarLotes: false,
  controlarValidade: false,
  estoqueMinimoPadrao: 10,
  bloquearVendaSemEstoque: true,
};

export const getStockPrefs = (): StockPrefs => {
  // Tentar carregar das configurações globais primeiro
  try {
    const globalPrefs = localStorage.getItem('2f.settings.stockPrefs');
    if (globalPrefs) {
      const parsed = JSON.parse(globalPrefs);
      return {
        ...mockStockPrefs,
        estoqueMinimoPadrao: parsed.estoqueMinimoPadrao || mockStockPrefs.estoqueMinimoPadrao,
        bloquearVendaSemEstoque: parsed.bloquearVendaSemEstoque ?? mockStockPrefs.bloquearVendaSemEstoque,
      };
    }
  } catch (error) {
    console.warn('Erro ao carregar preferências de estoque:', error);
  }
  
  return mockStockPrefs;
};

export const saveStockPrefs = (prefs: Partial<StockPrefs>): void => {
  Object.assign(mockStockPrefs, prefs);
  
  // Salvar também nas configurações globais se for estoqueMinimoPadrao ou bloquearVendaSemEstoque
  if (prefs.estoqueMinimoPadrao !== undefined || prefs.bloquearVendaSemEstoque !== undefined) {
    try {
      const globalPrefs = {
        estoqueMinimoPadrao: prefs.estoqueMinimoPadrao ?? mockStockPrefs.estoqueMinimoPadrao,
        bloquearVendaSemEstoque: prefs.bloquearVendaSemEstoque ?? mockStockPrefs.bloquearVendaSemEstoque,
      };
      localStorage.setItem('2f.settings.stockPrefs', JSON.stringify(globalPrefs));
    } catch (error) {
      console.warn('Erro ao salvar preferências de estoque:', error);
    }
  }
};

// Product interface for compatibility with stock operations
export interface Product {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  estoque: number;
  estoqueAtual: number;
  estoqueMinimo?: number;
  categoria?: string;
  barcode?: string;
  unidade?: string;
  validade?: string;
}

export const getProducts = (): Product[] => {
  // Get products from mockAPI (same data used in Products tab)
  const products = mockAPI.getProducts();
  const categories = mockAPI.getCategories();
  const prefs = getStockPrefs();
  
  return products.map(p => {
    const category = categories.find(c => c.id === p.categoryId);
    return {
      id: p.id,
      nome: p.name,
      sku: p.sku,
      preco: p.price,
      estoque: p.stock,
      estoqueAtual: p.stock,
      estoqueMinimo: p.minStock || prefs.estoqueMinimoPadrao || 10, // Use product's minStock or default
      categoria: category?.name,
      barcode: p.barcode,
      unidade: 'un',
      validade: undefined, // Can be added later if needed
    };
  });
};

// Supplier interface and functions
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
  createdAt: string;
}

export interface CreateSupplierDto {
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

// Mock suppliers data
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    nome: 'Pet Distribuidora Ltda',
    cnpjCpf: '12.345.678/0001-90',
    email: 'contato@petdistribuidora.com',
    telefone: '(11) 9999-8888',
    endereco: {
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01234-567',
    },
    ativo: true,
    createdAt: new Date().toISOString(),
  },
];

export const getSuppliers = (): Supplier[] => {
  return mockSuppliers;
};

export const createSupplier = (data: CreateSupplierDto): Supplier => {
  const supplier: Supplier = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  
  mockSuppliers.push(supplier);
  return supplier;
};

export const updateSupplier = (id: string, data: Partial<CreateSupplierDto>): Supplier => {
  const index = mockSuppliers.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Supplier not found');
  
  mockSuppliers[index] = { ...mockSuppliers[index], ...data };
  return mockSuppliers[index];
};

export const toggleSupplierStatus = (id: string): Supplier => {
  const index = mockSuppliers.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Supplier not found');
  
  mockSuppliers[index].ativo = !mockSuppliers[index].ativo;
  return mockSuppliers[index];
};

// Stock alerts interface and function
export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK';
  severity: 'warning' | 'critical';
  createdAt: string;
}

export const getStockAlerts = (): StockAlert[] => {
  // Generate alerts based on current stock levels vs minimum stock
  const alerts: StockAlert[] = [];
  
  // Get products from mockAPI (same data used in Products tab)
  const products = mockAPI.getProducts();
  const categories = mockAPI.getCategories();
  
  products.forEach(product => {
    const minStock = 10; // Default minimum stock level
    
    if (product.stock === 0) {
      alerts.push({
        id: `alert-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stock,
        minStock,
        alertType: 'OUT_OF_STOCK',
        severity: 'critical',
        createdAt: new Date().toISOString(),
      });
    } else if (product.stock <= minStock) {
      alerts.push({
        id: `alert-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stock,
        minStock,
        alertType: 'LOW_STOCK',
        severity: 'warning',
        createdAt: new Date().toISOString(),
      });
    }
  });
  
  return alerts;
};
