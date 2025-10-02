import { useQuery } from '@tanstack/react-query';
import { getSales } from '@/lib/pos-api';
import { mockAPI } from '@/lib/mock-data';
import { startOfMonth, startOfDay, endOfDay, differenceInDays } from 'date-fns';

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
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  // Buscar vendas (await porque retorna Promise)
  const allSales = await getSales();

  // Vendas de hoje
  const todaySales = allSales.filter(sale => {
    const saleDate = new Date(sale.data);
    return saleDate >= todayStart && saleDate <= todayEnd;
  });

  // Vendas do mês
  const monthSales = allSales.filter(sale => {
    const saleDate = new Date(sale.data);
    return saleDate >= monthStart;
  });

  // Produtos (usando mockAPI que retorna Product com propriedades em inglês)
  const products = mockAPI.getProducts();
  const activeProducts = products.filter(p => p.active !== false).length;
  
  // Estoque
  const lowStockCount = products.filter(p => 
    p.stock > 0 && p.stock < 10 // threshold mock de 10 unidades
  ).length;
  
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  
  // A vencer (mock - considerar produtos com validade próxima)
  const expiringSoonCount = Math.floor(Math.random() * 5);

  // Série de receita do mês (mock - dados diários)
  const daysInMonth = differenceInDays(now, monthStart) + 1;
  const monthRevenueSeries = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => ({
    day: `${i + 1}`,
    total: Math.random() * 5000 + 1000
  }));

  return {
    todaySalesCount: todaySales.length,
    todaySalesTotal: todaySales.reduce((sum, sale) => sum + sale.total, 0),
    monthSalesCount: monthSales.length,
    monthSalesTotal: monthSales.reduce((sum, sale) => sum + sale.total, 0),
    activeProducts,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    monthRevenueSeries
  };
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 1000 * 60, // 1 minuto
    refetchOnWindowFocus: false
  });
}
