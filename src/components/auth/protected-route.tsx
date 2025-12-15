import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { setPlan, getCurrentPlan, PlanType } from '@/lib/entitlements';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireLicense?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireLicense = true 
}: ProtectedRouteProps) {
  const { user, licenseStatus, isLoading, isFirstInstallation, isHubOnline, checkHubConnectivity, syncLicenseWithHub, refreshLicenseStatus } = useAuth();
  const location = useLocation();
  const [checkingInstallation, setCheckingInstallation] = useState(false);
  const [syncingLicense, setSyncingLicense] = useState(false);
  const warnedInvalidLicenseRef = useRef(false);
  const lastSyncAttemptRef = useRef<number>(0);
  const DEBUG = Boolean(import.meta.env.VITE_DEBUG_PROTECTED_ROUTE === 'true');
  const SYNC_COOLDOWN_MS = Math.max(30000, Number(import.meta.env.VITE_HUB_SYNC_COOLDOWN_MS ?? 120000));

  if (DEBUG) {
    console.log('🛡️ PROTECTED ROUTE - Estado atual:', {
      pathname: location.pathname,
      user: user ? 'PRESENTE' : 'AUSENTE',
      licenseStatus: licenseStatus,
      isLoading,
      requireAuth,
      requireLicense
    });
  }

  useEffect(() => {
    if (DEBUG) console.log('🛡️ PROTECTED ROUTE useEffect - Verificando condições...');
    
    // Se não há usuário e é necessário autenticação
    if (!isLoading && requireAuth && !user) {
      if (DEBUG) console.log('❌ PROTECTED ROUTE - Usuário não autenticado, mostrando toast');
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
    }

    // Licenciamento inválido: apenas efeitos (sem side-effects em render)
    if (!isLoading && requireLicense && licenseStatus && !licenseStatus.isValid) {
      if (DEBUG) console.log('🎫 PROTECTED ROUTE - Licença inválida (effect):', licenseStatus);
      if (!licenseStatus.isInstalled) {
        setCheckingInstallation(true);
        (async () => {
          try {
            const isFirst = await isFirstInstallation();
            if (DEBUG) console.log('🔍 PROTECTED ROUTE - Resultado isFirstInstallation:', isFirst);
            if (isFirst) {
              toast({
                title: 'Sistema não instalado',
                description: 'Primeira instalação detectada. Redirecionamento bloqueado para debug.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Licença inválida',
                description: 'Sistema sem licença válida. Redirecionamento bloqueado para debug.',
                variant: 'destructive',
              });
            }
          } catch (e) {
            if (DEBUG) console.error('💥 PROTECTED ROUTE - Erro ao verificar instalação:', e);
            toast({
              title: 'Erro de verificação',
              description: 'Erro ao verificar instalação. Redirecionamento bloqueado para debug.',
              variant: 'destructive',
            });
          } finally {
            setCheckingInstallation(false);
          }
        })();
      } else {
        if (!warnedInvalidLicenseRef.current) {
          warnedInvalidLicenseRef.current = true;
          toast({
            title: 'Licença inválida',
            description: 'Tentando sincronizar com o Hub. Você continuará logado.',
            variant: 'default',
          });
        }
        if (!syncingLicense) {
          // Evitar tentativas frequentes de sincronização: cooldown configurável
          const now = Date.now();
          if (lastSyncAttemptRef.current && (now - lastSyncAttemptRef.current) < SYNC_COOLDOWN_MS) {
            if (DEBUG) console.log('⏱️ PROTECTED ROUTE - Ignorando sync, dentro do cooldown');
            return;
          }
          lastSyncAttemptRef.current = now;
          setSyncingLicense(true);
          (async () => {
            // Não forçar checagem de conectividade aqui; confiar no polling do AuthContext
            const online = isHubOnline;
            if (online) {
              if (DEBUG) console.log('🔄 PROTECTED ROUTE - Hub online detectado, sincronizando licença...');
              try {
                await syncLicenseWithHub();
                await refreshLicenseStatus(true);
              } catch (e) {
                if (DEBUG) console.warn('⚠️ PROTECTED ROUTE - Falha na sincronização automática da licença', e);
              }
            }
            setSyncingLicense(false);
          })();
        }
      }
    }
  }, [user, isLoading, requireAuth, requireLicense, licenseStatus, isHubOnline]);

  // Sincroniza entitlements do frontend com o plano da licença válida
  useEffect(() => {
    if (licenseStatus?.isValid && licenseStatus.plan) {
      const rawPlan = String(licenseStatus.plan).toLowerCase();
      // Normaliza possíveis variações de nomes
      const map: Record<string, PlanType> = {
        starter: 'starter',
        basico: 'starter',
        básico: 'starter',
        basic: 'starter',
        pro: 'pro',
        profissional: 'pro',
        max: 'max',
        enterprise: 'max',
        development: 'max'
      };
      const normalized = map[rawPlan] || (['starter','pro','max'].includes(rawPlan) ? (rawPlan as PlanType) : 'starter');
      const current = getCurrentPlan();
      if (current !== normalized) {
        console.log('🔄 PROTECTED ROUTE - Atualizando plano local para refletir licença:', { normalized, rawPlan });
        setPlan(normalized);
        // Dispara evento para atualizar hooks que observam mudanças de plano
        window.dispatchEvent(new Event('planChanged'));
      }
    }
  }, [licenseStatus]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || checkingInstallation) {
    if (DEBUG) console.log('⏳ PROTECTED ROUTE - Mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Verificar autenticação
  if (requireAuth && !user) {
    if (DEBUG) console.log('🔐 PROTECTED ROUTE - Redirecionando para login (sem usuário)');
    return <Navigate to="/erp/login" state={{ from: location }} replace />;
  }

  // (Removido) Efeito separado de licenciamento para evitar mismatch de hooks em HMR

  // Se chegou até aqui, pode renderizar o conteúdo
  if (DEBUG) console.log('✅ PROTECTED ROUTE - Todas as verificações passaram, renderizando conteúdo');
  return <>{children}</>;
}
