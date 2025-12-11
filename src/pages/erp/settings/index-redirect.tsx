import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPermissions } from '@/lib/settings-api';

export default function SettingsIndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const perms = getCurrentPermissions();
    const candidates: Array<{ perm: string; path: string }> = [
      { perm: 'settings:organization', path: '/erp/settings/organization' },
      { perm: 'settings:users', path: '/erp/settings/users' },
      { perm: 'settings:roles', path: '/erp/settings/roles' },
      { perm: 'settings:billing', path: '/erp/settings/billing' },
      { perm: 'settings:licenses', path: '/erp/settings/licenses' },
      { perm: 'settings:units', path: '/erp/settings/units' },
      { perm: 'settings:categories', path: '/erp/settings/categories' },
      { perm: 'settings:payments', path: '/erp/settings/payments' },
      { perm: 'settings:import-export', path: '/erp/settings/import-export' },
    ];

    const firstAllowed = candidates.find((c) => perms.includes(c.perm));
    navigate(firstAllowed ? firstAllowed.path : '/erp/dashboard', { replace: true });
  }, [navigate]);

  return null;
}

