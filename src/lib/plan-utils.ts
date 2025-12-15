// Pequenos utilitários para normalizar chaves de plano
// Objetivo: transformar diferentes representações (id, key ou nome)
// em uma das três chaves canônicas: 'starter' | 'pro' | 'max'

export type PlanKey = 'starter' | 'pro' | 'max';

export function normalizePlanKey(raw?: string | null): PlanKey | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim().toLowerCase();

  // Mapeia nomes e variações comuns para chaves canônicas
  const map: Record<string, PlanKey> = {
    starter: 'starter', basico: 'starter', básico: 'starter', basic: 'starter',
    pro: 'pro', profissional: 'pro', professional: 'pro',
    max: 'max', enterprise: 'max', premium: 'max', development: 'max'
  };

  return map[s] || (['starter', 'pro', 'max'].includes(s) ? (s as PlanKey) : undefined);
}

// Extrai a planKey de um objeto de assinatura do Hub de forma resiliente
export function extractPlanKeyFromSubscription(subscription: any): PlanKey | undefined {
  if (!subscription) return undefined;
  const plan = subscription.plan || {};

  // Preferir id/key se existirem; caso contrário, usar name
  return (
    normalizePlanKey(plan.id) ||
    normalizePlanKey(plan.key) ||
    normalizePlanKey(plan.planKey) ||
    normalizePlanKey(subscription.planKey) ||
    normalizePlanKey(plan.name)
  );
}

