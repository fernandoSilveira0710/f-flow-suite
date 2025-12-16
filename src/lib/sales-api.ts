/**
 * Sales API - Real Integration
 * This module now delegates to client-local (and hub when needed) via pos-api.
 * All localStorage logic has been removed.
 */

import { getSales as apiGetSales, getSaleById as apiGetSaleById, refundSale as apiRefundSale, type Sale } from './pos-api';

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

export interface SaleDetail extends Sale {}

// Helper: normalize payment filter values to compare against sale.paymentMethod
const paymentMatches = (paymentMethod: string, filter: string) => {
  const pm = paymentMethod.toLowerCase();
  const f = filter.toLowerCase();
  switch (f) {
    case 'pix':
      return pm.includes('pix');
    case 'debit':
    case 'débito':
    case 'debit card':
      return pm.includes('débito') || pm.includes('debit');
    case 'credit':
    case 'crédito':
    case 'credit card':
      return pm.includes('crédito') || pm.includes('credit');
    case 'cash':
    case 'dinheiro':
      return pm.includes('dinheiro') || pm.includes('cash');
    default:
      return pm.includes(f);
  }
};

// Helper: normalize status filter values to backend statuses
const statusMatches = (status: string, filter: string) => {
  const s = status.toLowerCase();
  const f = filter.toLowerCase();
  switch (f) {
    case 'pago':
    case 'completed':
      return s === 'completed' || s === 'pago';
    case 'cancelado':
    case 'cancelled':
    case 'refunded':
      return s === 'cancelled' || s === 'refunded' || s === 'cancelado';
    default:
      return s.includes(f);
  }
};

// Sales API
export const fetchSales = async (filters?: SaleFilters): Promise<Sale[]> => {
  try {
    let sales = await apiGetSales();

    // Apply filters client-side
    if (filters) {
      // Range/date filters
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      const now = new Date();

      if (filters.range) {
        endDate = new Date(now);
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
            // handled below by dateFrom/dateTo
            break;
          default:
            break;
        }
      }

      if (filters.startDate || filters.dateFrom) {
        startDate = new Date(filters.startDate || filters.dateFrom!);
        startDate.setHours(0, 0, 0, 0);
      }
      if (filters.endDate || filters.dateTo) {
        endDate = new Date(filters.endDate || filters.dateTo!);
        endDate.setHours(23, 59, 59, 999);
      }

      if (startDate) {
        sales = sales.filter((s) => new Date(s.createdAt) >= startDate!);
      }
      if (endDate) {
        sales = sales.filter((s) => new Date(s.createdAt) <= endDate!);
      }

      // Search query
      if (filters.q) {
        const q = filters.q.toLowerCase();
        sales = sales.filter(
          (s) =>
            s.operator.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            (s.code || '').toLowerCase().includes(q)
        );
      }

      // Operator (legacy)
      if (filters.operator) {
        const q = filters.operator.toLowerCase();
        sales = sales.filter((s) => s.operator.toLowerCase().includes(q));
      }

      // Payment method filters
      if (filters.pay && filters.pay.length > 0) {
        sales = sales.filter((s) => filters.pay!.some((p) => paymentMatches(s.paymentMethod, p)));
      }

      // Single payment method (legacy)
      if (filters.paymentMethod) {
        const pm = filters.paymentMethod;
        sales = sales.filter((s) => paymentMatches(s.paymentMethod, pm));
      }

      // Status filters
      if (filters.status && filters.status.length > 0) {
        sales = sales.filter((s) => filters.status!.some((st) => statusMatches(s.status, st)));
      }
    }

    // Sort by newest first
    sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sales;
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
};

export const fetchSaleById = async (saleId: string): Promise<SaleDetail | null> => {
  try {
    const sale = await apiGetSaleById(saleId);
    return sale;
  } catch (error) {
    console.error('Error fetching sale by ID:', error);
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

    for (const sale of sales) {
      salesByPaymentMethod[sale.paymentMethod] = (salesByPaymentMethod[sale.paymentMethod] || 0) + sale.total;
      salesByOperator[sale.operator] = (salesByOperator[sale.operator] || 0) + sale.total;
    }

    return { totalSales, totalRevenue, averageTicket, salesByPaymentMethod, salesByOperator };
  } catch (error) {
    console.error('Error generating sales report:', error);
    return { totalSales: 0, totalRevenue: 0, averageTicket: 0, salesByPaymentMethod: {}, salesByOperator: {} };
  }
};

// Export functions
export const exportSalesToCSV = (sales: Sale[]): string => {
  const header = 'ID,Código,Operador,Método de Pagamento,Status,Total,Cliente,Data de Criação';
  const rows = sales.map(
    (sale) =>
      `${sale.id},${sale.code ?? ''},${sale.operator},${sale.paymentMethod},${sale.status},${sale.total},${sale.customerId || ''},${sale.createdAt}`
  );
  return [header, ...rows].join('\n');
};

export const refundSale = async (saleId: string): Promise<void> => {
  try {
    await apiRefundSale(saleId);
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};
