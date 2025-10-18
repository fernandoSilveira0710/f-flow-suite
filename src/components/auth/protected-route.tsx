import { useEffect, useState } from 'react';
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
  const { user, licenseStatus, isLoading, isFirstInstallation } = useAuth();
  const location = useLocation();
  const [checkingInstallation, setCheckingInstallation] = useState(false);

  console.log('🛡️ PROTECTED ROUTE - Estado atual:', {
    pathname: location.pathname,
    user: user ? 'PRESENTE' : 'AUSENTE',
    licenseStatus: licenseStatus,
    isLoading,
    requireAuth,
    requireLicense
  });

  useEffect(() => {
    console.log('🛡️ PROTECTED ROUTE useEffect - Verificando condições...');
    
    // Se não há usuário e é necessário autenticação
    if (!isLoading && requireAuth && !user) {
      console.log('❌ PROTECTED ROUTE - Usuário não autenticado, mostrando toast');
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
    }

    // Se não há licença válida e é necessário licenciamento
    if (!isLoading && requireLicense && licenseStatus && !licenseStatus.isValid) {
      console.log('⚠️ PROTECTED ROUTE - Licença inválida detectada:', licenseStatus);
      if (!licenseStatus.isInstalled) {
        console.log('📦 PROTECTED ROUTE - Sistema não instalado');
        toast({
          title: "Sistema não configurado",
          description: "Você precisa se cadastrar e configurar o sistema.",
          variant: "destructive",
        });
      } else {
        console.log('🎫 PROTECTED ROUTE - Licença expirada');
        toast({
          title: "Licença inválida",
          description: "Sua licença expirou ou é inválida. Renove seu plano.",
          variant: "destructive",
        });
      }
    }
  }, [user, licenseStatus, isLoading, requireAuth, requireLicense]);

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
        enterprise: 'max'
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
    console.log('⏳ PROTECTED ROUTE - Mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Verificar autenticação
  if (requireAuth && !user) {
    console.log('🔐 PROTECTED ROUTE - Redirecionando para login (sem usuário)');
    return <Navigate to="/erp/login" state={{ from: location }} replace />;
  }

  // Verificar licenciamento com lógica inteligente
  if (requireLicense && licenseStatus) {
    console.log('🎫 PROTECTED ROUTE - Verificando licenciamento:', licenseStatus);
    if (!licenseStatus.isValid) {
      console.log('❌ PROTECTED ROUTE - Licença inválida');
      if (!licenseStatus.isInstalled) {
        console.log('📦 PROTECTED ROUTE - Sistema não instalado - verificando primeira instalação...');
        // Sistema não instalado - verificar se é primeira instalação
        const handleRedirect = async () => {
          setCheckingInstallation(true);
          try {
            console.log('🔍 PROTECTED ROUTE - Chamando isFirstInstallation...');
            const isFirst = await isFirstInstallation();
            console.log('🔍 PROTECTED ROUTE - Resultado isFirstInstallation:', isFirst);
            
            if (isFirst) {
              console.log('🆕 PROTECTED ROUTE - Primeira instalação detectada');
              console.log('⚠️ PROTECTED ROUTE - BLOQUEANDO redirecionamento para manter logs do console');
              // TEMPORARIAMENTE BLOQUEADO: window.location.href = [SITE_URL from env]
              toast({
                title: "Sistema não instalado",
                description: "Primeira instalação detectada. Redirecionamento bloqueado para debug.",
                variant: "destructive"
              });
            } else {
              console.log('👤 PROTECTED ROUTE - Usuário existente sem instalação detectado');
              console.log('⚠️ PROTECTED ROUTE - BLOQUEANDO redirecionamento para manter logs do console');
              // TEMPORARIAMENTE BLOQUEADO: window.location.href = [SITE_URL from env]/cadastro
              toast({
                title: "Licença inválida",
                description: "Sistema sem licença válida. Redirecionamento bloqueado para debug.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('💥 PROTECTED ROUTE - Erro ao verificar instalação:', error);
            console.log('⚠️ PROTECTED ROUTE - BLOQUEANDO redirecionamento para manter logs do console');
            // TEMPORARIAMENTE BLOQUEADO: window.location.href = [SITE_URL from env]
            toast({
              title: "Erro de verificação",
              description: "Erro ao verificar instalação. Redirecionamento bloqueado para debug.",
              variant: "destructive"
            });
          } finally {
            setCheckingInstallation(false);
          }
        };
        
        handleRedirect();
        return null;
      } else {
        console.log('🔄 PROTECTED ROUTE - Sistema instalado mas licença inválida - redirecionando para login');
        // Sistema instalado mas licença inválida - redirecionar para login (que mostrará modal de planos)
        return <Navigate to="/erp/login" replace />;
      }
    }
  }

  // Se chegou até aqui, pode renderizar o conteúdo
  console.log('✅ PROTECTED ROUTE - Todas as verificações passaram, renderizando conteúdo');
  return <>{children}</>;
}