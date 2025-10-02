import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroCardProps {
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string;
  metricLink: string;
  isLoading?: boolean;
}

export function HeroCard({
  title,
  subtitle,
  metricLabel,
  metricValue,
  metricLink,
  isLoading
}: HeroCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-secondary p-8">
        <div className="relative z-10">
          <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
          <Skeleton className="h-5 w-48 mb-6 bg-white/20" />
          <div className="flex items-end justify-between">
            <div>
              <Skeleton className="h-4 w-32 mb-2 bg-white/20" />
              <Skeleton className="h-12 w-40 bg-white/20" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-secondary p-8 border-0 shadow-lg">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          {title}
        </h1>
        <p className="text-primary-foreground/80 mb-6">
          {subtitle}
        </p>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-primary-foreground/70 mb-1">
              {metricLabel}
            </p>
            <p className="text-4xl font-bold text-primary-foreground tabular-nums">
              {metricValue}
            </p>
          </div>

          <Link
            to={metricLink}
            className="flex items-center gap-2 text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors group"
          >
            <span>Ver detalhes</span>
            <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
