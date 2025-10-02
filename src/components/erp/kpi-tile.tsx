import { Link } from 'react-router-dom';
import { LucideIcon, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface KpiTileProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  disabledReason?: string;
  isLoading?: boolean;
}

const toneStyles = {
  default: 'text-primary',
  success: 'text-secondary',
  warning: 'text-amber-500',
  danger: 'text-destructive'
};

export function KpiTile({
  label,
  value,
  icon: Icon,
  href,
  tone = 'default',
  disabled = false,
  disabledReason,
  isLoading
}: KpiTileProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <Card className={cn(
      "transition-all hover:shadow-md",
      disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {value}
            </p>
            {disabled && disabledReason && (
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {disabledReason}
              </span>
            )}
          </div>

          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            disabled ? "bg-muted" : "bg-primary/10"
          )}>
            <Icon className={cn("h-5 w-5", toneStyles[tone])} />
          </div>
        </div>

        {!disabled && (
          <div className="mt-4 flex items-center justify-end">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason || 'Recurso bloqueado'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={href}>
            {content}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ver detalhes</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
