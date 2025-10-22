/**
 * Environment Configuration
 * Centraliza todas as URLs e configurações de ambiente
 */

// URLs das APIs
export const API_URLS = {
  HUB: import.meta.env.VITE_HUB_API_URL || 'http://localhost:3001',
  CLIENT_LOCAL: import.meta.env.VITE_CLIENT_LOCAL_API_URL || 'http://localhost:8081',
  SITE: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
  FRONTEND: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:8080',
} as const;

// URLs de desenvolvimento
export const DEV_URLS = {
  PRISMA_STUDIO_HUB: import.meta.env.VITE_PRISMA_STUDIO_HUB_URL || 'http://127.0.0.1:5555',
  PRISMA_STUDIO_LOCAL: import.meta.env.VITE_PRISMA_STUDIO_LOCAL_URL || 'http://127.0.0.1:5556',
} as const;

// Endpoints específicos
export const ENDPOINTS = {
  // Hub endpoints
  HUB_LOGIN: `${API_URLS.HUB}/public/login`,
  HUB_REGISTER: `${API_URLS.HUB}/public/register`,
  HUB_PLANS: `${API_URLS.HUB}/public/plans`,
  HUB_HEALTH: `${API_URLS.HUB}/health`,
  HUB_LICENSES_VALIDATE: `${API_URLS.HUB}/licenses/validate`,
  HUB_SUBSCRIPTION: `${API_URLS.HUB}/subscriptions`,
  HUB_TENANTS_SUBSCRIPTION: (tenantId: string) => `${API_URLS.HUB}/tenants/${tenantId}/subscription`,
  HUB_LICENSES_UPDATE_PLAN: (tenantId: string) => `${API_URLS.HUB}/licenses/tenant/${tenantId}/update-plan`,

  // Client-Local endpoints
  CLIENT_USERS_HAS_USERS: `${API_URLS.CLIENT_LOCAL}/users/has-users`,
  CLIENT_USERS_SYNC: `${API_URLS.CLIENT_LOCAL}/users/sync`,
  CLIENT_LICENSING_ACTIVATE: `${API_URLS.CLIENT_LOCAL}/licensing/activate`,
  CLIENT_LICENSING_PERSIST: `${API_URLS.CLIENT_LOCAL}/licensing/persist`,
  CLIENT_LICENSING_VALIDATE_OFFLINE: `${API_URLS.CLIENT_LOCAL}/licensing/validate-offline`,
  CLIENT_LICENSING_CURRENT: `${API_URLS.CLIENT_LOCAL}/licensing/plan/current`,
  CLIENT_LICENSING_SYNC_PLAN: `${API_URLS.CLIENT_LOCAL}/licensing/sync-plan`,
  CLIENT_AUTH_OFFLINE_LOGIN: `${API_URLS.CLIENT_LOCAL}/auth/offline-login`,
  CLIENT_PLANS_SUBSCRIPTION: (tenantId: string) => `${API_URLS.CLIENT_LOCAL}/plans/tenants/${tenantId}/subscription`,
  CLIENT_PLANS_INVOICES: (tenantId: string) => `${API_URLS.CLIENT_LOCAL}/plans/tenants/${tenantId}/invoices`,

  // Dashboard
  CLIENT_DASHBOARD_SUMMARY: `${API_URLS.CLIENT_LOCAL}/dashboard/summary`,

  // Site endpoints
  SITE_PLANS: `${API_URLS.SITE}/planos`,
  SITE_CADASTRO: `${API_URLS.SITE}/cadastro`,
  SITE_RENOVACAO: `${API_URLS.SITE}/renovacao`,
} as const;

// Configurações de ambiente
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

export default {
  API_URLS,
  DEV_URLS,
  ENDPOINTS,
  ENV_CONFIG,
};
