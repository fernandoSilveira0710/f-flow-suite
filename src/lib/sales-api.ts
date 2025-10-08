/**
 * Sales API - LocalStorage Integration
 * Uses browser LocalStorage for sales operations
 */

import { Sale } from './pos-api';

// Types and Interfaces
export interface SaleFilters {
  range?: 'today' | 'yesterday' | '7d' | 'month' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  pay?: string[];
  status?: string[];
  // Legacy support
  startDate?: string;
  endDate?: string;
  operator?: string;
  paymentMethod?: string;
}

export interface SaleDetail extends Sale {
  // Additional fields for detailed view
}

// LocalStorage Configuration
const SALES_STORAGE_KEY = '2f.pos.sales';

// LocalStorage Helper functions
const getSalesFromStorage = (): Sale[] => {
  try {
    const salesData = localStorage.getItem(SALES_STORAGE_KEY);
    return salesData ? JSON.parse(salesData) : [];
  } catch (error) {
    console.error('Error reading sales from localStorage:', error);
    return [];
  }
};

const saveSalesToStorage = (sales: Sale[]): void => {
  try {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  } catch (error) {
    console.error('Error saving sales to localStorage:', error);
  }
};

// Initialize with sample data if empty
const initializeSampleData = (): void => {
  const existingSales = getSalesFromStorage();
  if (existingSales.length === 0) {
    const sampleSales: Sale[] = [
      {
        id: 'sale_175',
        code: 'SALE-175',
        operator: 'Admin Demo',
        paymentMethod: 'Cartão Débito',
        status: 'completed',
        total: 65.00,
        customerId: 'customer-1',
        createdAt: new Date('2025-10-08T12:38:00').toISOString(),
        updatedAt: new Date('2025-10-08T12:38:00').toISOString(),
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            qty: 1,
            unitPrice: 65.00,
            subtotal: 65.00,
            createdAt: new Date('2025-10-08T12:38:00').toISOString(),
          }
        ]
      },
      {
        id: 'sale_176',
        code: 'SALE-176',
        operator: 'Admin Demo',
        paymentMethod: 'PIX',
        status: 'completed',
        total: 162.50,
        customerId: 'customer-2',
        createdAt: new Date('2025-10-08T12:07:00').toISOString(),
        updatedAt: new Date('2025-10-08T12:07:00').toISOString(),
        items: [
          {
            id: 'item-2',
            productId: 'product-2',
            qty: 1,
            unitPrice: 162.50,
            subtotal: 162.50,
            createdAt: new Date('2025-10-08T12:07:00').toISOString(),
          }
        ]
      },
      {
        id: 'sale_177',
        code: 'SALE-177',
        operator: 'Sistema',
        paymentMethod: 'Dinheiro',
        status: 'completed',
        total: 379.80,
        customerId: 'customer-3',
        createdAt: new Date('2025-10-08T11:29:00').toISOString(),
        updatedAt: new Date('2025-10-08T11:29:00').toISOString(),
        items: [
          {
            id: 'item-3',
            productId: 'product-3',
            qty: 1,
            unitPrice: 379.80,
            subtotal: 379.80,
            createdAt: new Date('2025-10-08T11:29:00').toISOString(),
          }
        ]
      },
      {
        id: 'sale_178',
        code: 'SALE-178',
        operator: 'João Silva',
        paymentMethod: 'Cartão Crédito',
        status: 'cancelled',
        total: 125.00,
        customerId: 'customer-4',
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
        items: [
          {
            id: 'item-4',
            productId: 'product-4',
            qty: 1,
            unitPrice: 125.00,
            subtotal: 125.00,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          }
        ]
      },
      {
        id: 'sale_179',
        code: 'SALE-179',
        operator: 'Maria Santos',
        paymentMethod: 'PIX',
        status: 'refunded',
        total: 89.90,
        customerId: 'customer-5',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        items: [
          {
            id: 'item-5',
            productId: 'product-5',
            qty: 1,
            unitPrice: 89.90,
            subtotal: 89.90,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          }
        ]
      }
    ];
    saveSalesToStorage(sampleSales);
  }
};

// Initialize sample data on module load
initializeSampleData();

// Sales API
export const fetchSales = async (filters?: SaleFilters): Promise<Sale[]> => {
  try {
    let sales = getSalesFromStorage();
    
    // Apply filters
    if (filters) {
      // Handle range filter
      if (filters.range) {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        switch (filters.range) {
          case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'yesterday':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setDate(now.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
          case '7d':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'custom':
            if (filters.dateFrom) {
              startDate = new Date(filters.dateFrom);
            } else {
              startDate = new Date(0); // Beginning of time
            }
            if (filters.dateTo) {
              endDate = new Date(filters.dateTo);
              endDate.setHours(23, 59, 59, 999);
            }
            break;
          default:
            startDate = new Date(0);
        }

        if (startDate) {
          sales = sales.filter(sale => new Date(sale.createdAt) >= startDate);
        }
        if (endDate) {
          sales = sales.filter(sale => new Date(sale.createdAt) <= endDate);
        }
      }

      // Handle custom date range (legacy support)
      if (filters.startDate || filters.dateFrom) {
        const startDate = new Date(filters.startDate || filters.dateFrom!);
        sales = sales.filter(sale => new Date(sale.createdAt) >= startDate);
      }
      
      if (filters.endDate || filters.dateTo) {
        const endDate = new Date(filters.endDate || filters.dateTo!);
        endDate.setHours(23, 59, 59, 999); // End of day
        sales = sales.filter(sale => new Date(sale.createdAt) <= endDate);
      }
      
      // Handle search query
      if (filters.q) {
        const query = filters.q.toLowerCase();
        sales = sales.filter(sale => 
          sale.operator.toLowerCase().includes(query) ||
          sale.id.toLowerCase().includes(query) ||
          sale.code?.toLowerCase().includes(query)
        );
      }

      // Handle operator filter (legacy support)
      if (filters.operator) {
        sales = sales.filter(sale => 
          sale.operator.toLowerCase().includes(filters.operator!.toLowerCase())
        );
      }
      
      // Handle payment method filters
      if (filters.pay && filters.pay.length > 0) {
        sales = sales.filter(sale => {
          const paymentMethod = sale.paymentMethod.toLowerCase();
          return filters.pay!.some(filterPayment => {
            const filterLower = filterPayment.toLowerCase();
            // Map filter values to actual payment methods
            switch (filterLower) {
              case 'pix':
                return paymentMethod.includes('pix');
              case 'debit':
              case 'débito':
                return paymentMethod.includes('débito') || paymentMethod.includes('debit');
              case 'credit':
              case 'crédito':
                return paymentMethod.includes('crédito') || paymentMethod.includes('credit');
              case 'cash':
              case 'dinheiro':
                return paymentMethod.includes('dinheiro') || paymentMethod.includes('cash');
              default:
                return paymentMethod.includes(filterLower);
            }
          });
        });
      }

      // Handle single payment method filter (legacy support)
      if (filters.paymentMethod) {
        sales = sales.filter(sale => sale.paymentMethod === filters.paymentMethod);
      }
      
      // Handle status filters
      if (filters.status && filters.status.length > 0) {
        sales = sales.filter(sale => {
          const saleStatus = sale.status.toLowerCase();
          return filters.status!.some(filterStatus => {
            const filterLower = filterStatus.toLowerCase();
            // Map filter values to actual statuses
            switch (filterLower) {
              case 'pago':
              case 'completed':
                return saleStatus === 'completed' || saleStatus === 'pago';
              case 'cancelado':
              case 'cancelled':
              case 'refunded':
                return saleStatus === 'cancelled' || saleStatus === 'refunded' || saleStatus === 'cancelado';
              default:
                return saleStatus.includes(filterLower);
            }
          });
        });
      }
    }
    
    // Sort by creation date (newest first)
    sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return sales;
  } catch (error) {
    console.error('Error fetching sales from localStorage:', error);
    return [];
  }
};

export const fetchSaleById = async (saleId: string): Promise<SaleDetail | null> => {
  try {
    const sales = getSalesFromStorage();
    const sale = sales.find(s => s.id === saleId);
    return sale || null;
  } catch (error) {
    console.error('Error fetching sale by ID from localStorage:', error);
    return null;
  }
};

export const createSale = async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
  try {
    const sales = getSalesFromStorage();
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    sales.push(newSale);
    saveSalesToStorage(sales);
    
    return newSale;
  } catch (error) {
    console.error('Error creating sale in localStorage:', error);
    throw error;
  }
};

export const updateSale = async (saleId: string, saleData: Partial<Sale>): Promise<Sale | null> => {
  try {
    const sales = getSalesFromStorage();
    const saleIndex = sales.findIndex(s => s.id === saleId);
    
    if (saleIndex === -1) {
      return null;
    }
    
    sales[saleIndex] = {
      ...sales[saleIndex],
      ...saleData,
      updatedAt: new Date().toISOString(),
    };
    
    saveSalesToStorage(sales);
    return sales[saleIndex];
  } catch (error) {
    console.error('Error updating sale in localStorage:', error);
    throw error;
  }
};

export const deleteSale = async (saleId: string): Promise<boolean> => {
  try {
    const sales = getSalesFromStorage();
    const filteredSales = sales.filter(s => s.id !== saleId);
    
    if (filteredSales.length === sales.length) {
      return false; // Sale not found
    }
    
    saveSalesToStorage(filteredSales);
    return true;
  } catch (error) {
    console.error('Error deleting sale from localStorage:', error);
    return false;
  }
};

export const getSalesReport = async (filters?: SaleFilters): Promise<{
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  salesByPaymentMethod: Record<string, number>;
  salesByOperator: Record<string, number>;
}> => {
  try {
    const sales = await fetchSales(filters);
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const salesByPaymentMethod: Record<string, number> = {};
    const salesByOperator: Record<string, number> = {};
    
    sales.forEach(sale => {
      // Group by payment method
      if (salesByPaymentMethod[sale.paymentMethod]) {
        salesByPaymentMethod[sale.paymentMethod] += sale.total;
      } else {
        salesByPaymentMethod[sale.paymentMethod] = sale.total;
      }
      
      // Group by operator
      if (salesByOperator[sale.operator]) {
        salesByOperator[sale.operator] += sale.total;
      } else {
        salesByOperator[sale.operator] = sale.total;
      }
    });
    
    return {
      totalSales,
      totalRevenue,
      averageTicket,
      salesByPaymentMethod,
      salesByOperator,
    };
  } catch (error) {
    console.error('Error generating sales report:', error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageTicket: 0,
      salesByPaymentMethod: {},
      salesByOperator: {},
    };
  }
};

// Export functions
export const exportSalesToCSV = async (sales: Sale[]): Promise<void> => {
  const csvContent = [
    // CSV Header
    'ID,Código,Operador,Método de Pagamento,Status,Total,Cliente,Data de Criação',
    // CSV Data
    ...sales.map(sale => 
      `${sale.id},${sale.code},${sale.operator},${sale.paymentMethod},${sale.status},${sale.total},${sale.customerId || ''},${sale.createdAt}`
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `vendas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const refundSale = async (saleId: string): Promise<void> => {
  try {
    const sale = await updateSale(saleId, { status: 'refunded' });
    if (!sale) {
      throw new Error('Sale not found');
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};
