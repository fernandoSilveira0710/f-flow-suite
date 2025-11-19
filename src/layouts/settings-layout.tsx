import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEntitlements } from '@/hooks/use-entitlements';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Shield,
  CreditCard,
  Key as KeyIcon,
  ShoppingCart,
  Calendar,
  Scissors,
  Package,
  
  Upload,
  Wallet,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  requiresPlan: string | null;
} | {
  type: 'separator';
  label: string;
};

export default function SettingsLayout() {
  const location = useLocation();
  const { currentPlan, entitlements } = useEntitlements();

  const menuItems: MenuItem[] = [
    {
      label: 'Geral',
      type: 'separator' as const,
    },
    {
      label: 'Organização',
      icon: Building2,
      path: '/erp/settings/organization',
      requiresPlan: null,
    },
    {
      label: 'Usuários & Assentos',
      icon: Users,
      path: '/erp/settings/users',
      requiresPlan: null,
    },
    {
      label: 'Papéis & Permissões',
      icon: Shield,
      path: '/erp/settings/roles',
      requiresPlan: null,
    },
    {
      label: 'Plano & Faturamento',
      icon: CreditCard,
      path: '/erp/settings/billing',
      requiresPlan: null,
    },
    {
      label: 'Licenças & Ativação',
      icon: KeyIcon,
      path: '/erp/settings/licenses',
      requiresPlan: null,
    },
    {
      type: 'separator' as const,
      label: 'Módulos',
    },
    // Agenda removida (não visível para nenhum plano)
    // Banho & Tosa removido (não visível para nenhum plano)
    
    {
      label: 'Unidades de Medida',
      icon: Package,
      path: '/erp/settings/units',
      requiresPlan: null,
    },
    {
      type: 'separator' as const,
      label: 'Geral',
    },
    {
      label: 'Métodos de Pagamento',
      icon: Wallet,
      path: '/erp/settings/payments',
      requiresPlan: null,
    },
    {
      label: 'Importar/Exportar',
      icon: Upload,
      path: '/erp/settings/import-export',
      requiresPlan: null,
    },
  ];

  const planNames = {
    starter: 'Starter',
    pro: 'Pro',
    max: 'Max',
  };

  const isPlanRequired = (requiresPlan: string | null) => {
    if (!requiresPlan) return false;
    if (requiresPlan === 'pro' && currentPlan === 'starter') return true;
    if (requiresPlan === 'max' && (currentPlan === 'starter' || currentPlan === 'pro')) return true;
    return false;
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <div className="sticky top-6">
          <nav className="space-y-1">
            {menuItems.map((item, idx) => {
              if ('type' in item) {
                return (
                  <div key={`sep-${idx}`} className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                  </div>
                );
              }

              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              const needsUpgrade = isPlanRequired(item.requiresPlan);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50',
                    needsUpgrade && 'opacity-70'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {needsUpgrade && (
                    <Badge variant="outline" className="text-xs">
                      Pro/Max
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>


        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
