import { PageHeader } from '@/components/erp/page-header';
import { KpiCard } from '@/components/erp/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAPI } from '@/lib/mock-data';
import { BarChart3, Package, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const kpis = mockAPI.getDashboardKPIs();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu negócio"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <KpiCard key={index} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Vendas Recentes</CardTitle>
            </div>
            <CardDescription>Últimas transações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">Venda #{1000 + i}</p>
                    <p className="text-xs text-muted-foreground">Há {i} hora(s)</p>
                  </div>
                  <p className="font-semibold">R$ {(Math.random() * 200 + 50).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-secondary" />
              <CardTitle>Produtos em Destaque</CardTitle>
            </div>
            <CardDescription>Mais vendidos do mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAPI.getProducts().slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R$ {product.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{product.stock} un.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
