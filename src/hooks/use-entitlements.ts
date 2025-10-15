import { useEffect, useState } from 'react';
import { getEntitlements, Entitlements, getCurrentPlan, PlanType, setPlan } from '@/lib/entitlements';
import { useAuth } from '@/contexts/auth-context';

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<Entitlements>(getEntitlements());
  const [currentPlan, setCurrentPlan] = useState<PlanType>(getCurrentPlan());
  const { licenseStatus } = useAuth();

  // Manter sincronizado com mudanças de storage no mesmo tab
  useEffect(() => {
    const handleStorageChange = () => {
      setEntitlements(getEntitlements());
      setCurrentPlan(getCurrentPlan());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Alinhar imediatamente com o plano vindo do contexto de autenticação,
  // evitando corrida com qualquer fetch assíncrono externo
  useEffect(() => {
    if (licenseStatus?.plan) {
      const raw = String(licenseStatus.plan).toLowerCase();
      const map: Record<string, PlanType> = {
        starter: 'starter', basico: 'starter', básico: 'starter', basic: 'starter',
        pro: 'pro', profissional: 'pro',
        max: 'max', enterprise: 'max'
      };
      const normalized = map[raw] || (['starter','pro','max'].includes(raw) ? raw as PlanType : 'starter');
      if (currentPlan !== normalized) {
        setPlan(normalized);
        setCurrentPlan(normalized);
        setEntitlements(getEntitlements());
      }
    }
  }, [licenseStatus?.plan]);

  return { entitlements, currentPlan };
}
