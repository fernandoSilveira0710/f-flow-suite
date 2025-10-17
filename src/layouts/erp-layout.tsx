import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { UpgradeDialog } from '@/components/erp/upgrade-dialog';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Warehouse,
  Calendar,
  Scissors,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Search,
  Package2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ENDPOINTS } from '@/lib/env';

export default function ErpLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState('');
  const [requiredPlan, setRequiredPlan] = useState('');
  const location = useLocation();
  const { entitlements, currentPlan } = useEntitlements();
  const { logout } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/erp/dashboard',
      enabled: true,
    },
    {
      label: 'Produtos',
      icon: Package,
      path: '/erp/produtos',
      enabled: entitlements.products,
      feature: 'Gestão de Produtos',
      plan: 'Starter',
    },
    {
      label: 'PDV',
      icon: ShoppingCart,
      path: '/erp/pdv',
      enabled: entitlements.pdv,
      feature: 'PDV',
      plan: 'Starter',
    },
    {
      label: 'Vendas',
      icon: Receipt,
      path: '/erp/vendas',
      enabled: true,
    },
    {
      label: 'Estoque',
      icon: Warehouse,
      path: '/erp/estoque',
      enabled: entitlements.stock,
      feature: 'Controle de Estoque',
      plan: 'Starter',
    },
    // Banho & Tosa removido (não visível para nenhum plano)
    // Agenda removida (não visível para nenhum plano)
    {
      label: 'Relatórios',
      icon: BarChart3,
      path: '/erp/relatorios',
      enabled: entitlements.reports,
      feature: 'Relatórios',
      plan: 'Max',
    },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (!item.enabled) {
      setBlockedFeature(item.feature || item.label);
      setRequiredPlan(item.plan || 'Pro');
      setShowUpgrade(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r bg-sidebar transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && (
            <Link to="/erp/dashboard" className="flex items-center gap-2 font-bold">
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Package2 className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <span>2F ERP</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.enabled ? item.path : '#'}
                onClick={(e) => {
                  if (!item.enabled) {
                    e.preventDefault();
                    handleMenuClick(item);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50',
                  !item.enabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}

          <div className="pt-4 border-t">
            <Link
              to="/erp/configuracoes"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                location.pathname === '/erp/configuracoes'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Configurações</span>}
            </Link>
          </div>
        </nav>

        {/* Plan Info */}
        {!collapsed && (
          <div className="p-4 border-t">
            <div className="rounded-lg bg-sidebar-accent p-3">
              <p className="text-xs text-sidebar-accent-foreground/70 mb-1">Plano Atual</p>
              {(() => {
                const hubPlanLabels: Record<string, string> = {
                  starter: 'Básico',
                  pro: 'Profissional',
                  max: 'Enterprise',
                };
                const label = hubPlanLabels[String(currentPlan)] || String(currentPlan);
                return <p className="text-sm font-semibold capitalize">{label}</p>;
              })()}
              <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                <a href={ENDPOINTS.SITE_RENOVACAO} target="_blank" rel="noopener noreferrer">Fazer Upgrade</a>
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background flex items-center justify-end px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature={blockedFeature}
        requiredPlan={requiredPlan}
      />
    </div>
  );
}
