/**
 * Sales Mock API
 * Reutiliza dados do PDV (pos-api) com camada de agregação
 */

import { getSales, type Sale } from './pos-api';
import { format, isWithinInterval, startOfDay, endOfDay, startOfMonth, subDays } from 'date-fns';

export interface SaleFilters {
  range?: 'today' | 'yesterday' | '7d' | 'month' | 'custom';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  pay?: string[];    // ['PIX', 'CASH']
  status?: string[]; // ['Paid', 'Canceled']
  q?: string;        // search ID/operator
  minTotal?: number;
  maxTotal?: number;
}

export type SaleDetail = Sale;

/**
 * Converte Sale do POS para SaleDetail (já é compatível)
 */
function toSaleDetail(sale: Sale): SaleDetail {
  return sale;
}

/**
 * GET /api/sales - Lista vendas com filtros
 */
export async function fetchSales(filters: SaleFilters = {}): Promise<SaleDetail[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); // simulate network
  
  let sales = (await getSales()).map(toSaleDetail);
  const now = new Date();

  // Range filter
  if (filters.range) {
    let start: Date;
    let end: Date = endOfDay(now);

    switch (filters.range) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case '7d':
        start = startOfDay(subDays(now, 7));
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case 'custom':
        if (filters.dateFrom) start = startOfDay(new Date(filters.dateFrom));
        else start = startOfDay(subDays(now, 30));
        if (filters.dateTo) end = endOfDay(new Date(filters.dateTo));
        break;
      default:
        start = startOfDay(subDays(now, 30));
    }

    sales = sales.filter(s => {
      const saleDate = new Date(s.data);
      return isWithinInterval(saleDate, { start, end });
    });
  }

  // Payment method filter
  if (filters.pay && filters.pay.length > 0) {
    sales = sales.filter(s => 
      filters.pay!.some(p => s.pagamento?.toUpperCase().includes(p.toUpperCase()))
    );
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    sales = sales.filter(s => filters.status!.includes(s.status));
  }

  // Search filter (ID or operator)
  if (filters.q) {
    const lower = filters.q.toLowerCase();
    sales = sales.filter(s => 
      s.id.toLowerCase().includes(lower) || 
      s.operador?.toLowerCase().includes(lower)
    );
  }

  // Min/Max total
  if (filters.minTotal !== undefined) {
    sales = sales.filter(s => s.total >= filters.minTotal!);
  }
  if (filters.maxTotal !== undefined) {
    sales = sales.filter(s => s.total <= filters.maxTotal!);
  }

  return sales.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/**
 * GET /api/sales/[id] - Detalhe da venda
 */
export async function fetchSaleById(id: string): Promise<SaleDetail | null> {
  const sales = await getSales();
  const sale = sales.find(s => s.id === id);
  return sale ? toSaleDetail(sale) : null;
}

/**
 * POST /api/sales/[id]/refund - Estornar venda (mock)
 */
export async function refundSale(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock: apenas simula, não persiste
  console.log(`[MOCK] Venda ${id} estornada`);
}

/**
 * POST /api/sales/export - Exportar vendas para CSV
 */
export function exportSalesToCSV(sales: SaleDetail[]): string {
  const headers = ['ID', 'Data', 'Operador', 'Itens', 'Total', 'Pagamento', 'Status'];
  const rows = sales.map(s => [
    s.id,
    format(new Date(s.data), 'dd/MM/yyyy HH:mm'),
    s.operador || '-',
    s.itens.length,
    s.total.toFixed(2),
    s.pagamento || '-',
    s.status
  ]);

  return [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');
}
