import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { toast } from 'sonner';

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
  const { user, licenseStatus, isFirstInstallation } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirectToSite, setShouldRedirectToSite] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setIsChecking(true);
      
      // Se não requer autenticação, permite acesso
      if (!requireAuth && !requireLicense) {
        setIsChecking(false);
        return;
      }

      // Se requer autenticação mas usuário não está logado
      if (requireAuth && !user) {
        // Verificar se é primeira instalação
        const isFirst = await isFirstInstallation();
        
        if (isFirst) {
          // Primeira instalação - redirecionar para site institucional
          setShouldRedirectToSite(true);
        } else {
          // Usuário existente - redirecionar para login
          setShouldRedirectToSite(false);
        }
        
        setIsChecking(false);
        return;
      }

      // Se requer licença mas não tem licença válida
      if (requireLicense && licenseStatus !== 'valid') {
        if (licenseStatus === 'invalid' || licenseStatus === 'expired') {
          toast.error('Licença inválida ou expirada. Faça login para ver os planos disponíveis.');
        } else {
          toast.error('Licença não encontrada. Faça login para obter uma licença.');
        }
        
        // Para licenças inválidas/expiradas, sempre vai para login (usuário já existe)
        setShouldRedirectToSite(false);
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [user, licenseStatus, requireAuth, requireLicense, isFirstInstallation]);

  // Mostrar loading enquanto verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar para site institucional (primeira instalação)
  if (shouldRedirectToSite && (!user || licenseStatus !== 'valid')) {
    window.location.href = import.meta.env.VITE_FRONTEND_URL;
    return null;
  }

  // Redirecionar para login (usuário existente)
  if (requireAuth && !user) {
    return <Navigate to="/erp/login" replace />;
  }

  // Redirecionar para login se licença inválida (usuário existente)
  if (requireLicense && licenseStatus !== 'valid') {
    return <Navigate to="/erp/login" replace />;
  }

  // Permitir acesso
  return <>{children}</>;
}