import { useQuery } from '@tanstack/react-query';
import { getSales } from '@/lib/pos-api';
import { getDashboardSummary } from '@/lib/dashboard-api';
import { getProducts as getProductsApi } from '@/lib/products-api';
import { getProducts as getMockProducts } from '@/lib/stock-api';
import { startOfMonth, startOfDay, endOfDay, differenceInDays, isAfter, isBefore } from 'date-fns';

interface DashboardSummary {
  todaySalesCount: number;
  todaySalesTotal: number;
  monthSalesCount: number;
  monthSalesTotal: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  monthRevenueSeries: Array<{ day: string; total: number }>;
}

async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  // Buscar resumo real do client-local
  const summary = await getDashboardSummary();

  // Buscar vendas reais para calcular a série do mês
  const allSales = await getSales();
  const monthSales = allSales.filter((sale) => new Date(sale.createdAt) >= monthStart && sale.status !== 'refunded');

  // Série de receita do mês (agregada por dia)
  const daysInMonth = differenceInDays(now, monthStart) + 1;
  const totalsByDay = new Array<number>(Math.min(daysInMonth, 31)).fill(0);
  for (const sale of monthSales) {
    const saleDate = new Date(sale.createdAt);
    if ((isAfter(saleDate, monthStart) || saleDate.getTime() === monthStart.getTime()) && isBefore(saleDate, endOfDay(now))) {
      const dayIndex = saleDate.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < totalsByDay.length) {
        totalsByDay[dayIndex] += sale.total || 0;
      }
    }
  }
  const monthRevenueSeries = totalsByDay.map((total, idx) => ({ day: `${idx + 1}`, total }));

  // Calcular produtos a vencer (30 dias) a partir dos produtos.
  // Usa API real e faz fallback para mock se necessário.
  let expiringSoonCount = 0;
  try {
    const products = await getProductsApi();
    const nowTs = now.getTime();
    expiringSoonCount = products.filter((p) => {
      if (!p.expiryDate) return false;
      const d = new Date(p.expiryDate);
      const diffDays = Math.ceil((d.getTime() - nowTs) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
  } catch {
    try {
      const products = getMockProducts().map((p) => ({ expiryDate: p.validade }));
      const nowTs = now.getTime();
      expiringSoonCount = products.filter((p) => {
        if (!p.expiryDate) return false;
        const d = new Date(p.expiryDate);
        const diffDays = Math.ceil((d.getTime() - nowTs) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      }).length;
    } catch {
      expiringSoonCount = 0;
    }
  }

  return {
    todaySalesCount: summary.vendas.quantidadeDia,
    todaySalesTotal: Number(summary.vendas.totalDia || 0),
    monthSalesCount: summary.vendas.quantidadeMes,
    monthSalesTotal: Number(summary.vendas.totalMes || 0),
    activeProducts: summary.estoque.produtosAtivos,
    lowStockCount: summary.estoque.produtosBaixoEstoque,
    outOfStockCount: summary.estoque.produtosSemEstoque,
    expiringSoonCount,
    monthRevenueSeries,
  };
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 1000 * 60, // 1 minuto
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });
}
