/**
 * Mock Data para desenvolvimento
 * Simula respostas da API
 */

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

let mockProducts: Product[] = [
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Alimentação', description: 'Rações e petiscos' },
  { id: '2', name: 'Higiene', description: 'Shampoos e produtos de limpeza' },
  { id: '3', name: 'Acessórios', description: 'Coleiras, guias e brinquedos' },
];

export const mockAPI = {
  // Products
  getProducts: (): Product[] => mockProducts,
  
  getProduct: (id: string): Product | undefined => 
    mockProducts.find(p => p.id === id),
  
  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...data,
      id: String(mockProducts.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProducts.push(newProduct);
    return newProduct;
  },
  
  updateProduct: (id: string, data: Partial<Product>): Product | undefined => {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    mockProducts[index] = {
      ...mockProducts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockProducts[index];
  },
  
  deleteProduct: (id: string): boolean => {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) return false;
    mockProducts.splice(index, 1);
    return true;
  },

  // Categories
  getCategories: (): Category[] => mockCategories,

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
      value: String(mockProducts.filter(p => p.active).length),
      change: '+2',
      trend: 'up',
    },
  ],
};
