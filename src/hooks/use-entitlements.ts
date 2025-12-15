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

    // Evento nativo (dispara apenas entre abas)
    window.addEventListener('storage', handleStorageChange);

    // Evento customizado (dispara na mesma aba quando updatePlan() é chamado)
    const handlePlanChanged = () => {
      setEntitlements(getEntitlements());
      setCurrentPlan(getCurrentPlan());
    };
    window.addEventListener('planChanged', handlePlanChanged as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('planChanged', handlePlanChanged as EventListener);
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
        max: 'max', enterprise: 'max', development: 'max'
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
