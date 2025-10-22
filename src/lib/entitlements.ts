/**
 * Sistema de Entitlements Mock (Feature Flags por Plano)
 * Prepara para integração futura com 2F License Hub
 */

export type PlanType = 'starter' | 'pro' | 'max';
import { API_URLS } from './env';

export interface Entitlements {
  products: boolean;
  pdv: boolean;
  stock: boolean;
  agenda: boolean;
  banho_tosa: boolean;
  reports: boolean;
  dashboards: boolean;
  seatLimit: number;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  priceAnnual: number;
  features: string[];
  entitlements: Entitlements;
}

const PLANS: Record<PlanType, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19.99,
    priceAnnual: 199.9,
    features: [
      'PDV Completo',
      'Gestão de Produtos',
      'Dashboards',
      'Controle de Estoque',
      '1 Usuário',
      'Suporte por E-mail',
    ],
    entitlements: {
      products: true,
      pdv: true,
      stock: true,
      agenda: false,
      banho_tosa: false,
      reports: false,
      dashboards: true,
      seatLimit: 1,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49.99,
    priceAnnual: 499.9,
    features: [
      'Tudo do Starter',
      'Agenda de Serviços',
      'Banho & Tosa',
      'Até 5 Usuários',
      'Suporte Prioritário',
      'API de Integração',
    ],
    entitlements: {
      products: true,
      pdv: true,
      stock: true,
      agenda: true,
      banho_tosa: true,
      reports: false,
      dashboards: true,
      seatLimit: 5,
    },
  },
  max: {
    id: 'max',
    name: 'Max',
    price: 99.99,
    priceAnnual: 999.9,
    features: [
      'Tudo do Pro',
      'Relatórios Avançados',
      'Até 15 Usuários',
      'White Label',
      'Gestor de Conta Dedicado',
      'Suporte 24/7',
      'Customizações',
    ],
    entitlements: {
      products: true,
      pdv: true,
      stock: true,
      agenda: true,
      banho_tosa: true,
      reports: true,
      dashboards: true,
      seatLimit: 15,
    },
  },
};

const STORAGE_KEY = '2f.plan';

// Função para buscar plano atual do Client-Local
async function fetchCurrentPlanFromHub(): Promise<PlanType | null> {
  try {
    const tenantId = localStorage.getItem('2f.tenantId') || 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';
    const response = await fetch(`${API_URLS.HUB}/plans/tenants/${tenantId}/subscription`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
    });

    if (response.ok) {
      const subscription = await response.json();
      if (subscription && subscription.plan) {
        const planKey = subscription.plan.name?.toLowerCase() || 'starter';
        return ['starter', 'pro', 'max'].includes(planKey) ? planKey as PlanType : 'starter';
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Erro ao buscar plano do Hub:', error);
    return null;
  }
}

// Função para buscar plano do client-local
async function fetchCurrentPlanFromClientLocal(): Promise<PlanType | null> {
  try {
    const response = await fetch(`${API_URLS.CLIENT_LOCAL}/licensing/plan/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const planKey = data.planKey?.toLowerCase() || 'starter';
      return ['starter', 'pro', 'max'].includes(planKey) ? planKey as PlanType : 'starter';
    }
    
    return null;
  } catch (error) {
    console.warn('Erro ao buscar plano do client-local:', error);
    return null;
  }
}

export function getCurrentPlan(): PlanType {
  if (typeof window === 'undefined') return 'starter';
  
  // Fallback para localStorage apenas se os serviços não estiverem disponíveis
  const newStored = localStorage.getItem('selectedPlan');
  if (newStored && ['starter', 'pro', 'max'].includes(newStored)) {
    return newStored as PlanType;
  }
  
  // Fallback para o storage key antigo
  const oldStored = localStorage.getItem(STORAGE_KEY);
  return (oldStored as PlanType) || 'starter';
}

// Nova função assíncrona para buscar plano atual com prioridade Hub -> client-local -> localStorage
export async function getCurrentPlanAsync(): Promise<PlanType> {
  if (typeof window === 'undefined') return 'starter';
  
  // 1. Tentar buscar do Hub primeiro
  const hubPlan = await fetchCurrentPlanFromHub();
  if (hubPlan) {
    // Atualizar localStorage para cache
    localStorage.setItem('selectedPlan', hubPlan);
    return hubPlan;
  }
  
  // 2. Fallback para client-local
  const clientLocalPlan = await fetchCurrentPlanFromClientLocal();
  if (clientLocalPlan) {
    // Atualizar localStorage para cache
    localStorage.setItem('selectedPlan', clientLocalPlan);
    return clientLocalPlan;
  }
  
  // 3. Fallback final para localStorage
  return getCurrentPlan();
}

export function setPlan(plan: PlanType): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selectedPlan', plan);
  localStorage.setItem(STORAGE_KEY, plan); // Manter compatibilidade
}

export function getEntitlements(): Entitlements {
  const planType = getCurrentPlan();
  return PLANS[planType].entitlements;
}

export function getPlan(planType: PlanType): Plan {
  return PLANS[planType];
}

export function getAllPlans(): Plan[] {
  return [PLANS.starter, PLANS.pro, PLANS.max];
}

export function hasFeature(feature: keyof Omit<Entitlements, 'seatLimit'>): boolean {
  const entitlements = getEntitlements();
  return entitlements[feature];
}
