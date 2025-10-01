import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
}

export function KpiCard({ label, value, change, trend }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change && trend && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-secondary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend === 'up' ? 'text-secondary' : 'text-destructive'
                )}
              >
                {change}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
