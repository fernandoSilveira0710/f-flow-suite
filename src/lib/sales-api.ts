/**
 * Sales API - Real API Integration
 * Connects to client-local server for sales operations
 */

import { Sale } from './pos-api';

// Types and Interfaces
export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  operator?: string;
  paymentMethod?: string;
  status?: string;
}

export interface SaleDetail extends Sale {
  // Additional fields for detailed view
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

// Sales API
export const fetchSales = async (filters?: SaleFilters): Promise<Sale[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.operator) params.append('operator', filters.operator);
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const endpoint = queryString ? `/pos/sales?${queryString}` : '/pos/sales';
    
    const sales = await apiCall<any[]>(endpoint);
    
    return sales.map(sale => ({
      id: sale.id,
      code: sale.code,
      operator: sale.operator,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      total: sale.total,
      customerId: sale.customerId,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: sale.items,
    }));
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
};

export const fetchSaleById = async (id: string): Promise<SaleDetail | null> => {
  try {
    const sale = await apiCall<any>(`/pos/sales/${id}`);
    
    return {
      id: sale.id,
      code: sale.code,
      operator: sale.operator,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      total: sale.total,
      customerId: sale.customerId,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: sale.items,
    };
  } catch (error) {
    console.error('Error fetching sale by id:', error);
    return null;
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
    await apiCall(`/sales/${saleId}/refund`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};
