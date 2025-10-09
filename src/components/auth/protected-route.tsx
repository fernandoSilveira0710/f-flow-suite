import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';

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

  useEffect(() => {
    // Se não há usuário e é necessário autenticação
    if (!isLoading && requireAuth && !user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
    }

    // Se não há licença válida e é necessário licenciamento
    if (!isLoading && requireLicense && licenseStatus && !licenseStatus.isValid) {
      if (!licenseStatus.isInstalled) {
        toast({
          title: "Sistema não configurado",
          description: "Você precisa se cadastrar e configurar o sistema.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Licença inválida",
          description: "Sua licença expirou ou é inválida. Renove seu plano.",
          variant: "destructive",
        });
      }
    }
  }, [user, licenseStatus, isLoading, requireAuth, requireLicense]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || checkingInstallation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Verificar autenticação
  if (requireAuth && !user) {
    return <Navigate to="/erp/login" state={{ from: location }} replace />;
  }

  // Verificar licenciamento com lógica inteligente
  if (requireLicense && licenseStatus) {
    if (!licenseStatus.isValid) {
      if (!licenseStatus.isInstalled) {
        // Sistema não instalado - verificar se é primeira instalação
        const handleRedirect = async () => {
          setCheckingInstallation(true);
          try {
            const isFirst = await isFirstInstallation();
            if (isFirst) {
              // Primeira instalação - redirecionar para site institucional
              window.location.href = '/site';
            } else {
              // Usuário existente sem instalação - redirecionar para cadastro
              window.location.href = '/site/cadastro';
            }
          } catch (error) {
            console.error('Erro ao verificar instalação:', error);
            // Em caso de erro, redirecionar para site institucional
            window.location.href = '/site';
          } finally {
            setCheckingInstallation(false);
          }
        };
        
        handleRedirect();
        return null;
      } else {
        // Sistema instalado mas licença inválida - redirecionar para login (que mostrará modal de planos)
        return <Navigate to="/erp/login" replace />;
      }
    }
  }

  // Se chegou até aqui, pode renderizar o conteúdo
  return <>{children}</>;
}