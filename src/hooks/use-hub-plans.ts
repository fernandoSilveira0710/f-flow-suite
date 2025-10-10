import { useState, useEffect } from 'react';

export interface HubPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  maxSeats?: number;
  maxDevices?: number;
  active: boolean;
  popular?: boolean;
}

interface LocalPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const FALLBACK_PLANS: LocalPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    features: ['PDV Básico', 'Estoque', 'Clientes', 'Pets', 'Serviços']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 197,
    features: ['Tudo do Starter', 'Agenda', 'Profissionais', 'Relatórios', 'Dashboard']
  },
  {
    id: 'max',
    name: 'Max',
    price: 297,
    features: ['Tudo do Pro', 'Multi-lojas', 'API Avançada', 'Suporte Premium']
  }
];

export const useHubPlans = () => {
  const [plans, setPlans] = useState<HubPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHubAvailable, setIsHubAvailable] = useState(false);

  const fetchPlansFromHub = async (): Promise<HubPlan[]> => {
    try {
      const response = await fetch('http://localhost:8081/public/plans?active=true');
      if (response.ok) {
        const hubPlans = await response.json();
        setIsHubAvailable(true);
        return hubPlans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price || 0,
          currency: plan.currency || 'BRL',
          billingCycle: plan.billingCycle || 'monthly',
          features: plan.features || [],
          maxSeats: plan.maxSeats || 1,
          maxDevices: plan.maxDevices || 1,
          active: plan.active !== false,
          popular: plan.popular || false
        }));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Erro ao buscar planos do HUB:', error);
      setIsHubAvailable(false);
      throw error;
    }
  };

  const mapFallbackPlansToHub = (): HubPlan[] => {
    return FALLBACK_PLANS.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: 'BRL',
      billingCycle: 'monthly',
      features: plan.features,
      maxSeats: 1,
      maxDevices: 1,
      active: true,
      popular: plan.id === 'pro'
    }));
  };

  const loadPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      // Tentar buscar do HUB primeiro
      const hubPlans = await fetchPlansFromHub();
      setPlans(hubPlans);
    } catch (hubError) {
      console.warn('HUB não disponível, usando planos locais:', hubError);
      
      // Fallback para planos locais
      const fallbackPlans = mapFallbackPlansToHub();
      setPlans(fallbackPlans);
      setError('HUB não disponível - usando planos locais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const refetch = () => {
    loadPlans();
  };

  return {
    plans,
    loading,
    error,
    isHubAvailable,
    refetch
  };
};