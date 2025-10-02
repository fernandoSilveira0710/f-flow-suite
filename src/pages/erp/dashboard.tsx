import { HeroCard } from '@/components/erp/hero-card';
import { KpiTile } from '@/components/erp/kpi-tile';
import { RevenueCard } from '@/components/erp/revenue-card';
import { useDashboard } from '@/hooks/use-dashboard';
import { useEntitlements } from '@/hooks/use-entitlements';
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  AlertOctagon, 
  Calendar 
} from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();
  const { entitlements } = useEntitlements();

  useEffect(() => {
    if (error) {
      toast.error('Não foi possível carregar os dados do dashboard');
    }
  }, [error]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <HeroCard
        title="Bem-vindo ao 2F Solutions"
        subtitle="Plataforma de Gestão Comercial"
        metricLabel="Vendas de Hoje"
        metricValue={data ? formatCurrency(data.todaySalesTotal) : 'R$ 0,00'}
        metricLink="/erp/pdv/history?range=today"
        isLoading={isLoading}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiTile
          label="Vendas Hoje"
          value={data?.todaySalesCount ?? 0}
          icon={ShoppingCart}
          href="/erp/vendas?range=today"
          tone="success"
          isLoading={isLoading}
        />

        <KpiTile
          label="Vendas do Mês"
          value={data?.monthSalesCount ?? 0}
          icon={TrendingUp}
          href="/erp/vendas?range=month"
          tone="default"
          isLoading={isLoading}
        />

        <KpiTile
          label="Produtos Ativos"
          value={data?.activeProducts ?? 0}
          icon={Package}
          href="/erp/produtos?status=active"
          tone="default"
          isLoading={isLoading}
        />

        <KpiTile
          label="Estoque Baixo"
          value={data?.lowStockCount ?? 0}
          icon={AlertTriangle}
          href="/erp/estoque?filter=below-min"
          tone="warning"
          isLoading={isLoading}
          disabled={!entitlements.stock}
          disabledReason="Requer Stock"
        />

        <KpiTile
          label="Sem Estoque"
          value={data?.outOfStockCount ?? 0}
          icon={AlertOctagon}
          href="/erp/estoque?filter=out-of-stock"
          tone="danger"
          isLoading={isLoading}
          disabled={!entitlements.stock}
          disabledReason="Requer Stock"
        />

        <KpiTile
          label="Produtos a Vencer"
          value={data?.expiringSoonCount ?? 0}
          icon={Calendar}
          href="/erp/estoque?filter=expire-soon&days=30"
          tone="warning"
          isLoading={isLoading}
          disabled={!entitlements.stock}
          disabledReason="Requer Stock"
        />
      </div>

      {/* Revenue Card */}
      <RevenueCard
        title="Faturamento do Mês"
        total={data ? formatCurrency(data.monthSalesTotal) : 'R$ 0,00'}
        salesCount={data?.monthSalesCount ?? 0}
        href="/erp/vendas?range=month"
        series={data?.monthRevenueSeries}
        isLoading={isLoading}
      />
    </div>
  );
}
