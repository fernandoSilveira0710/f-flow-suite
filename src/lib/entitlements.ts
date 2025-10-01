/**
 * Sistema de Entitlements Mock (Feature Flags por Plano)
 * Prepara para integração futura com 2F License Hub
 */

export type PlanType = 'starter' | 'pro' | 'max';

export interface Entitlements {
  products: boolean;
  pdv: boolean;
  stock: boolean;
  agenda: boolean;
  banho_tosa: boolean;
  reports: boolean;
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
    price: 79,
    priceAnnual: 790,
    features: [
      'Gestão de Produtos',
      'PDV Completo',
      'Controle de Estoque',
      'Agenda de Serviços',
      '1 Usuário',
      'Suporte por E-mail',
    ],
    entitlements: {
      products: true,
      pdv: true,
      stock: true,
      agenda: true,
      banho_tosa: false,
      reports: false,
      seatLimit: 1,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 149,
    priceAnnual: 1490,
    features: [
      'Tudo do Starter',
      'Banho & Tosa',
      'Relatórios Avançados',
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
      reports: true,
      seatLimit: 5,
    },
  },
  max: {
    id: 'max',
    name: 'Max',
    price: 299,
    priceAnnual: 2990,
    features: [
      'Tudo do Pro',
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
      seatLimit: 15,
    },
  },
};

const STORAGE_KEY = '2f.plan';

export function getCurrentPlan(): PlanType {
  if (typeof window === 'undefined') return 'starter';
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored as PlanType) || 'starter';
}

export function setPlan(plan: PlanType): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, plan);
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
