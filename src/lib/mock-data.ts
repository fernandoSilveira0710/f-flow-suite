/**
 * Mock Data para desenvolvimento
 * Simula respostas da API
 */

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  type: 'weight' | 'volume' | 'unit' | 'length';
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  active: boolean;
  imageUrl?: string;
  gallery?: string[];
  unitOfMeasureId?: string;
  minStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface DashboardKPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Ração Premium 15kg',
    description: 'Ração super premium para cães adultos',
    sku: 'RAC-PREM-15',
    barcode: '7891234567890',
    categoryId: '1',
    price: 189.90,
    cost: 120.00,
    stock: 45,
    active: true,
    unitOfMeasureId: '1',
    minStock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Shampoo Pet Clean 500ml',
    description: 'Shampoo neutro para pets',
    sku: 'SHP-CLN-500',
    barcode: '7891234567891',
    categoryId: '2',
    price: 32.50,
    cost: 18.00,
    stock: 120,
    active: true,
    unitOfMeasureId: '4',
    minStock: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Coleira Premium M',
    description: 'Coleira de couro sintético tamanho M',
    sku: 'COL-PREM-M',
    barcode: '7891234567892',
    categoryId: '3',
    price: 45.00,
    cost: 25.00,
    stock: 32,
    active: true,
    unitOfMeasureId: '5',
    minStock: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Alimentação', description: 'Rações e petiscos' },
  { id: '2', name: 'Higiene', description: 'Shampoos e produtos de limpeza' },
  { id: '3', name: 'Acessórios', description: 'Coleiras, guias e brinquedos' },
];

const mockUnitsOfMeasure: UnitOfMeasure[] = [
  { id: '1', name: 'Quilograma', abbreviation: 'kg', type: 'weight', active: true },
  { id: '2', name: 'Grama', abbreviation: 'g', type: 'weight', active: true },
  { id: '3', name: 'Litro', abbreviation: 'L', type: 'volume', active: true },
  { id: '4', name: 'Mililitro', abbreviation: 'ml', type: 'volume', active: true },
  { id: '5', name: 'Unidade', abbreviation: 'un', type: 'unit', active: true },
  { id: '6', name: 'Metro', abbreviation: 'm', type: 'length', active: true },
  { id: '7', name: 'Centímetro', abbreviation: 'cm', type: 'length', active: true },
];

// Carregar produtos do localStorage se existir
const loadProductsFromStorage = (): Product[] => {
  const stored = localStorage.getItem('mock_products');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Erro ao carregar produtos do localStorage:', error);
    }
  }
  return mockProducts;
};

// Inicializar produtos com dados do localStorage
let currentProducts = loadProductsFromStorage();

export const mockAPI = {
  // Products
  getProducts: (): Product[] => currentProducts,
  
  getProduct: (id: string): Product | undefined => 
    currentProducts.find(p => p.id === id),
  
  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...data,
      id: String(currentProducts.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentProducts.push(newProduct);
    localStorage.setItem('mock_products', JSON.stringify(currentProducts));
    return newProduct;
  },
  
  updateProduct: (id: string, data: Partial<Product>): Product | undefined => {
    const index = currentProducts.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    currentProducts[index] = {
      ...currentProducts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('mock_products', JSON.stringify(currentProducts));
    return currentProducts[index];
  },
  
  deleteProduct: (id: string): boolean => {
    const index = currentProducts.findIndex(p => p.id === id);
    if (index === -1) return false;
    currentProducts.splice(index, 1);
    localStorage.setItem('mock_products', JSON.stringify(currentProducts));
    return true;
  },

  // Categories
  getCategories: (): Category[] => mockCategories,

  // Unidades de Medida
  getUnitsOfMeasure: (): UnitOfMeasure[] => mockUnitsOfMeasure.filter(u => u.active),
  
  getAllUnitsOfMeasure: (): UnitOfMeasure[] => mockUnitsOfMeasure,
  
  getUnitOfMeasure: (id: string): UnitOfMeasure | undefined => 
    mockUnitsOfMeasure.find(u => u.id === id),
  
  createUnitOfMeasure: (data: Omit<UnitOfMeasure, 'id'>): UnitOfMeasure => {
    const unit: UnitOfMeasure = {
      id: Date.now().toString(),
      ...data,
    };
    mockUnitsOfMeasure.push(unit);
    return unit;
  },
  
  updateUnitOfMeasure: (id: string, data: Partial<UnitOfMeasure>): UnitOfMeasure | undefined => {
    const index = mockUnitsOfMeasure.findIndex(u => u.id === id);
    if (index !== -1) {
      mockUnitsOfMeasure[index] = { ...mockUnitsOfMeasure[index], ...data };
      return mockUnitsOfMeasure[index];
    }
    return undefined;
  },
  
  deleteUnitOfMeasure: (id: string): boolean => {
    const index = mockUnitsOfMeasure.findIndex(u => u.id === id);
    if (index !== -1) {
      mockUnitsOfMeasure.splice(index, 1);
      return true;
    }
    return false;
  },

  // Dashboard KPIs
  getDashboardKPIs: (): DashboardKPI[] => [
    {
      label: 'Faturamento Hoje',
      value: 'R$ 2.845,00',
      change: '+12%',
      trend: 'up',
    },
    {
      label: 'Ticket Médio',
      value: 'R$ 142,25',
      change: '+5%',
      trend: 'up',
    },
    {
      label: 'Vendas do Dia',
      value: '20',
      change: '-3%',
      trend: 'down',
    },
    {
      label: 'Produtos Ativos',
      value: String(currentProducts.filter(p => p.active).length),
      change: '+2',
      trend: 'up',
    },
  ],
};
