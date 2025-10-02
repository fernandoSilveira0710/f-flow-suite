import { Link } from 'react-router-dom';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueCardProps {
  title: string;
  total: string;
  salesCount: number;
  href: string;
  series?: Array<{ day: string; total: number }>;
  isLoading?: boolean;
}

export function RevenueCard({
  title,
  total,
  salesCount,
  href,
  series = [],
  isLoading
}: RevenueCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-40 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calcular valores para o sparkline
  const max = Math.max(...series.map(s => s.total));
  const min = Math.min(...series.map(s => s.total));
  const range = max - min || 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-secondary" />
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>

          <Link
            to={href}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span>Ver relatório</span>
            <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-4xl font-bold text-secondary tabular-nums">
              {total}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {salesCount} {salesCount === 1 ? 'venda realizada' : 'vendas realizadas'}
            </p>
          </div>

          {series.length > 0 && (
            <div className="h-16 flex items-end gap-1">
              {series.map((point, i) => {
                const height = ((point.total - min) / range) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-secondary/20 rounded-t transition-all hover:bg-secondary/40"
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`Dia ${point.day}: ${point.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
