import { useEffect, useState } from 'react';
import { getEntitlements, Entitlements, getCurrentPlan, PlanType } from '@/lib/entitlements';

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<Entitlements>(getEntitlements());
  const [currentPlan, setCurrentPlan] = useState<PlanType>(getCurrentPlan());

  useEffect(() => {
    // Observar mudanças no localStorage
    const handleStorageChange = () => {
      setEntitlements(getEntitlements());
      setCurrentPlan(getCurrentPlan());
    };

    // Observar mudanças no planChanged event
    const handlePlanChange = () => {
      setEntitlements(getEntitlements());
      setCurrentPlan(getCurrentPlan());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('planChanged', handlePlanChange);
    
    // Observar mudanças no mesmo tab
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('planChanged', handlePlanChange);
      clearInterval(interval);
    };
  }, []);

  return { entitlements, currentPlan };
}
