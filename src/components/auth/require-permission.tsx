import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentPermissions } from '@/lib/settings-api';

type Props = {
  permission: string;
  children: React.ReactElement;
};

export function RequirePermission({ permission, children }: Props) {
  const allowed = (() => {
    const perms = getCurrentPermissions();
    return perms.includes(permission);
  })();

  useEffect(() => {
    if (!allowed) {
      toast.error('Você não tem permissão para acessar esta funcionalidade.');
    }
  }, [allowed]);

  if (!allowed) {
    return <Navigate to="/erp/dashboard" replace />;
  }

  return children;
}

export default RequirePermission;
