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
  RefreshCw,
  HelpCircle,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ENDPOINTS } from '@/lib/env';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQueryClient } from '@tanstack/react-query';

export default function ErpLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState('');
  const [requiredPlan, setRequiredPlan] = useState('');
  const location = useLocation();
  // Ocultar chrome (sidebar e header) na tela de troca de conta
  const hideChrome = location.pathname.startsWith('/erp/settings/switch-account');
  const { entitlements, currentPlan } = useEntitlements();
  const { logout, licenseStatus, isHubOnline, hubLastCheck, checkHubConnectivity, syncLicenseWithHub, refreshLicenseStatus, user, offlineDaysLeft, licenseCacheUpdatedAt } = useAuth();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatDateShort = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const handleRefreshHub = async () => {
    const online = await checkHubConnectivity();
    if (online) {
      await syncLicenseWithHub();
      // Após sincronizar com o Hub, também atualize o status local
      await refreshLicenseStatus(true);
    } else {
      // Mesmo offline, atualize a visão do status local para refletir cache
      await refreshLicenseStatus(true);
    }
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
      {!hideChrome && (
        <aside
          className={cn(
            'flex flex-col border-r bg-sidebar transition-all duration-300',
            collapsed ? 'w-16' : 'w-64'
          )}
        >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && (
            <Link to="/erp/dashboard" className="flex items-center gap-2 font-bold" onClick={() => {
              queryClient.refetchQueries({ queryKey: ['dashboard', 'summary'], type: 'active' });
            }}>
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
                    return;
                  }
                  if (item.path === '/erp/dashboard') {
                    queryClient.refetchQueries({ queryKey: ['dashboard', 'summary'], type: 'active' });
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
              {/* Versão do cliente local / ERP */}
              <p className="text-xs text-sidebar-accent-foreground/70 mt-1">
                Versão: {import.meta.env.VITE_APP_VERSION || '1.3.0'}
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                <a href={ENDPOINTS.SITE_RENOVACAO} target="_blank" rel="noopener noreferrer">Fazer Upgrade</a>
              </Button>
            </div>
          </div>
        )}
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {!hideChrome && (
          <header className="h-16 border-b bg-background flex items-center justify-end px-6">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-2">
              <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 border ${isHubOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                <span className={`h-2 w-2 rounded-full ${isHubOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs font-medium">{isHubOnline ? 'Hub Online' : 'Hub Offline'}</span>
              </span>

              {isHubOnline ? (
                <span className="text-xs text-muted-foreground">Atualizado: {formatDate(hubLastCheck || undefined)}</span>
              ) : (
                <>
                  {hubLastCheck && (
                    <span className="text-xs text-muted-foreground">
                      Último online: {formatDate(hubLastCheck)}
                    </span>
                  )}
                  {typeof offlineDaysLeft === 'number' && (
                    <span className="text-xs text-muted-foreground">
                      Restam {offlineDaysLeft} dias offline
                    </span>
                  )}
                </>
              )}

              {licenseStatus?.expiresAt && (
                <span className="text-xs text-muted-foreground">
                  • Vencimento: {formatDateShort(licenseStatus.expiresAt)}
                </span>
              )}

              {/* Removido botão de atualizar: status agora é verificado automaticamente a cada 10s */}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" title="Ajuda">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      {isHubOnline ? (
                        <>
                          <p><strong>Hub Online</strong>: sincronização ativa.</p>
                          <p>Atualizado: {formatDate(hubLastCheck || undefined)}</p>
                        </>
                      ) : (
                        <>
                          <p><strong>Hub Offline</strong>: sistema usa dados em cache.</p>
                          <p>Última atualização: {formatDate(licenseCacheUpdatedAt || undefined)}</p>
                          <p>Modo offline permite até {import.meta.env.VITE_OFFLINE_MAX_DAYS ?? 5} dias. {typeof offlineDaysLeft === 'number' ? ` Restam ${offlineDaysLeft} dias.` : ''}</p>
                          <p>Conecte ao Hub para renovar sincronização e licença.</p>
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-2 text-xs text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>Usuário: {user.name || user.email}</span>
              </div>
            )}
            <Link to="/erp/settings/switch-account">
              <Button variant="ghost" size="icon" title="Trocar conta">
                <Users className="h-5 w-5" />
              </Button>
            </Link>
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
        )}

        {/* Page Content */}
        <main className={cn('flex-1 overflow-auto', hideChrome ? 'p-0' : 'p-6')}>
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
