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

export interface CreateStockAdjustmentDto {
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface BulkStockAdjustmentDto {
  adjustments: CreateStockAdjustmentDto[];
}

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:3010';

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

export const adjustStock = async (adjustment: CreateStockAdjustmentDto): Promise<StockAdjustment> => {
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
      type: adjustmentResult.type,
      quantity: adjustmentResult.quantity,
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

export const bulkAdjustStock = async (bulkAdjustment: BulkStockAdjustmentDto): Promise<StockAdjustment[]> => {
  try {
    const result = await apiCall<any>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(bulkAdjustment),
    });
    
    return result.adjustments.map((adj: any) => ({
      id: adj.id,
      productId: adj.productId,
      type: adj.type,
      quantity: adj.quantity,
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

export const getStockMovements = async (productId?: string): Promise<StockAdjustment[]> => {
  try {
    // Note: This would require a new endpoint in client-local to get stock movements/adjustments history
    // For now, we'll return an empty array as this functionality needs to be implemented in client-local
    console.warn('Stock movements endpoint not yet implemented in client-local');
    return [];
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return [];
  }
};

// Mock data and functions for frontend compatibility
const mockMovements: StockMovement[] = [];

export const getMovements = (): StockMovement[] => {
  return mockMovements;
};

export const createMovement = (data: CreateMovementDto): StockMovement => {
  const movement: StockMovement = {
    id: Date.now().toString(),
    tipo: data.tipo,
    produtoId: data.produtoId,
    produtoNome: `Produto ${data.produtoId}`, // In real app, would fetch product name
    sku: data.sku,
    quantidade: data.quantidade,
    custoUnit: data.custoUnit,
    valorTotal: data.custoUnit ? data.custoUnit * data.quantidade : undefined,
    origem: data.origem,
    motivo: data.motivo,
    documento: data.documento,
    data: new Date().toISOString(),
    usuario: 'Admin Demo',
  };

  mockMovements.unshift(movement);
  return movement;
};

export interface StockPrefs {
  alertaEstoqueBaixo: boolean;
  limiteMinimo: number;
  controlarLotes: boolean;
  controlarValidade: boolean;
}

const mockStockPrefs: StockPrefs = {
  alertaEstoqueBaixo: true,
  limiteMinimo: 5,
  controlarLotes: false,
  controlarValidade: false,
};

export const getStockPrefs = (): StockPrefs => {
  return mockStockPrefs;
};

export const saveStockPrefs = (prefs: StockPrefs): void => {
  Object.assign(mockStockPrefs, prefs);
};

// Product interface for compatibility
export interface Product {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  estoque: number;
  categoria?: string;
  barcode?: string;
}

// Mock products data
const mockProducts: Product[] = [
  {
    id: '1',
    nome: 'Ração Premium Cães',
    sku: 'RAC001',
    preco: 89.90,
    estoque: 25,
    categoria: 'Alimentação',
    barcode: '7891234567890',
  },
  {
    id: '2',
    nome: 'Shampoo Antipulgas',
    sku: 'SHP001',
    preco: 24.50,
    estoque: 15,
    categoria: 'Higiene',
    barcode: '7891234567891',
  },
  {
    id: '3',
    nome: 'Brinquedo Mordedor',
    sku: 'BRQ001',
    preco: 12.90,
    estoque: 8,
    categoria: 'Brinquedos',
    barcode: '7891234567892',
  },
];

export const getProducts = (): Product[] => {
  return mockProducts;
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
  
  mockProducts.forEach(product => {
    const minStock = 10; // Default minimum stock level
    
    if (product.estoque === 0) {
      alerts.push({
        id: `alert-${product.id}`,
        productId: product.id,
        productName: product.nome,
        sku: product.sku,
        currentStock: product.estoque,
        minStock,
        alertType: 'OUT_OF_STOCK',
        severity: 'critical',
        createdAt: new Date().toISOString(),
      });
    } else if (product.estoque <= minStock) {
      alerts.push({
        id: `alert-${product.id}`,
        productId: product.id,
        productName: product.nome,
        sku: product.sku,
        currentStock: product.estoque,
        minStock,
        alertType: 'LOW_STOCK',
        severity: 'warning',
        createdAt: new Date().toISOString(),
      });
    }
  });
  
  return alerts;
};
