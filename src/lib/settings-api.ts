/**
 * API Mock para Settings (simula API Routes)
 * Futuramente apontará para 2F License Hub via VITE_LICENSE_HUB_URL
 */

import { getCurrentPlan, setPlan as setEntitlementsPlan, getEntitlements } from './entitlements';
import { ENDPOINTS } from './env';
import { apiClient, getTenantId } from './api-client';

// Types
export interface Organization {
  tenantId: string;
  nomeFantasia: string;
  razaoSocial?: string;
  documento?: string;
  email: string;
  telefone?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  timezone: string;
  moeda: string;
  idioma: string;
}

export interface Branding {
  logoUrl?: string;
  faviconUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  acento?: string;
  tema: 'light' | 'dark' | 'system';
  exibicaoMarcaPainel: boolean;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  roleId: string;
  ativo: boolean;
}

export interface Role {
  id: string;
  nome: string;
  permissions: string[];
}

export interface Seat {
  id: string;
  nome: string;
  email: string;
  roleId: string;
  ativo: boolean;
  tipo: 'USUARIO' | 'ASSENTO'; // Diferencia usuários reais de assentos
  criadoEm: string;
  ultimoAcesso?: string;
}

export interface PlanInfo {
  plano: 'starter' | 'pro' | 'max';
  seatLimit: number;
  recursos: Record<string, { enabled: boolean }>;
  ciclo: 'MENSAL' | 'ANUAL';
  proximoCobranca?: string;
}

export interface LicenseInfo {
  licenseKey?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  expiracao?: string;
  dispositivosAtivos?: number;
}

export interface ApiKey {
  id: string;
  nome: string;
  tokenPrefix: string;
  criadoEm: string;
}

export interface Webhook {
  id: string;
  url: string;
  eventos: string[];
  ativo: boolean;
}

export interface PosPrefs {
  impressora: 'nenhuma' | 'termica' | 'a4';
  reciboAuto: boolean;
  abrirGaveta: boolean;
}

export interface AgendaPrefs {
  intervaloPadraoMin: number;
  permitirDuploAgendamento: boolean;
}

export interface PetPrefs {
  banhoDuracaoMin: number;
  tosaDuracaoMin: number;
  pedirAssinaturaTermo?: boolean;
}

export interface StockPrefs {
  estoqueMinimoPadrao?: number;
  bloquearVendaSemEstoque?: boolean;
}

export interface AuditEvent {
  id: string;
  data: string;
  tipo: string;
  usuario: string;
  payload: string;
}

// Storage keys
const STORAGE_KEYS = {
  organization: '2f.settings.organization',
  branding: '2f.settings.branding',
  users: '2f.settings.users',
  roles: '2f.settings.roles',
  seats: '2f.settings.seats',
  apiKeys: '2f.settings.apiKeys',
  webhooks: '2f.settings.webhooks',
  posPrefs: '2f.settings.posPrefs',
  agendaPrefs: '2f.settings.agendaPrefs',
  petPrefs: '2f.settings.petPrefs',
  stockPrefs: '2f.settings.stockPrefs',
  planCycle: '2f.settings.planCycle',
  auditEvents: '2f.audit.events',
};

// Helpers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setInStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Audit helpers
const getCurrentUserEmail = (): string => {
  try {
    const authRaw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
    if (authRaw) {
      const auth = JSON.parse(authRaw || '{}');
      return auth?.email || 'unknown';
    }
  } catch {}
  return 'unknown';
};

const appendAuditEvent = (tipo: string, payload: unknown): void => {
  if (typeof window === 'undefined') return;
  const events = getFromStorage<AuditEvent[]>(STORAGE_KEYS.auditEvents, []);
  const evt: AuditEvent = {
    id: Date.now().toString(),
    data: new Date().toISOString(),
    tipo,
    usuario: getCurrentUserEmail(),
    payload: (() => {
      try { return JSON.stringify(payload); } catch { return String(payload); }
    })(),
  };
  setInStorage(STORAGE_KEYS.auditEvents, [evt, ...events].slice(0, 1000));
};

// Default data
const DEFAULT_ORGANIZATION: Organization = {
  tenantId: 'demo-tenant',
  nomeFantasia: '2F Solutions Demo',
  razaoSocial: '2F Solutions Ltda',
  documento: '12.345.678/0001-90',
  email: 'contato@2fsolutions.com.br',
  telefone: '(11) 98765-4321',
  endereco: {
    logradouro: 'Rua Demo',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01234-567',
  },
  timezone: 'America/Sao_Paulo',
  moeda: 'BRL',
  idioma: 'pt-BR',
};

const DEFAULT_BRANDING: Branding = {
  tema: 'light',
  exibicaoMarcaPainel: true,
  corPrimaria: '#2563EB',
  corSecundaria: '#22C55E',
  acento: '#F59E0B',
};

const DEFAULT_USERS: User[] = [
  { id: '1', nome: 'Admin Demo', email: 'admin@demo.com', roleId: 'admin', ativo: true },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    nome: 'Admin',
    permissions: [
      'products:read', 'products:write', 'products:delete',
      'pos:read', 'pos:checkout', 'pos:refund', 'pos:open', 'pos:close',
      'sales:read', 'sales:refund',
      'stock:read', 'stock:entry', 'stock:exit', 'stock:adjust', 'stock:purchase_order',
      'agenda:read', 'agenda:write', 'agenda:cancel',
      'pet:read', 'pet:write', 'pet:workorder',
      'reports:read', 'reports:export',
      'settings:read', 'settings:write', 'settings:danger',
      'settings:organization', 'settings:users', 'settings:roles', 'settings:billing', 'settings:licenses', 'settings:units', 'settings:categories', 'settings:payments', 'settings:import-export',
    ],
  },
  {
    id: 'vendedor',
    nome: 'Vendedor',
    permissions: ['products:read', 'pos:read', 'pos:checkout', 'sales:read', 'stock:read'],
  },
  {
    id: 'estoquista',
    nome: 'Estoquista',
    permissions: ['products:read', 'stock:read', 'stock:entry', 'stock:exit', 'stock:adjust', 'stock:purchase_order'],
  },
  {
    id: 'groomer',
    nome: 'Groomer',
    permissions: ['pet:read', 'pet:write', 'pet:workorder', 'agenda:read', 'agenda:write'],
  },
];

const DEFAULT_SEATS: Seat[] = [
  { 
    id: '1', 
    nome: 'Assento Demo 1', 
    email: 'assento1@demo.com', 
    roleId: 'admin', 
    ativo: true, 
    tipo: 'ASSENTO',
    criadoEm: new Date().toISOString()
  },
  { 
    id: '2', 
    nome: 'Assento Demo 2', 
    email: 'assento2@demo.com', 
    roleId: 'admin', 
    ativo: false, 
    tipo: 'ASSENTO',
    criadoEm: new Date().toISOString()
  },
];

export const ALL_PERMISSIONS = [
  { id: 'products:read', nome: 'Ver Produtos', grupo: 'Produtos' },
  { id: 'products:write', nome: 'Editar Produtos', grupo: 'Produtos' },
  { id: 'products:delete', nome: 'Excluir Produtos', grupo: 'Produtos' },
  { id: 'pos:read', nome: 'Ver PDV', grupo: 'PDV' },
  { id: 'pos:checkout', nome: 'Realizar Vendas', grupo: 'PDV' },
  { id: 'pos:refund', nome: 'Realizar Devoluções', grupo: 'PDV' },
  { id: 'pos:open', nome: 'Abrir Caixa', grupo: 'PDV' },
  { id: 'pos:close', nome: 'Fechar Caixa', grupo: 'PDV' },
  { id: 'sales:read', nome: 'Ver Vendas', grupo: 'Vendas' },
  { id: 'sales:refund', nome: 'Estornar Vendas', grupo: 'Vendas' },
  { id: 'stock:read', nome: 'Ver Estoque', grupo: 'Estoque' },
  { id: 'stock:entry', nome: 'Entrada de Estoque', grupo: 'Estoque' },
  { id: 'stock:exit', nome: 'Saída de Estoque', grupo: 'Estoque' },
  { id: 'stock:adjust', nome: 'Ajustar Estoque', grupo: 'Estoque' },
  { id: 'stock:purchase_order', nome: 'Criar Pedidos de Compra', grupo: 'Estoque' },
  { id: 'agenda:read', nome: 'Ver Agenda', grupo: 'Agenda' },
  { id: 'agenda:write', nome: 'Editar Agenda', grupo: 'Agenda' },
  { id: 'agenda:cancel', nome: 'Cancelar Agendamentos', grupo: 'Agenda' },
  { id: 'pet:read', nome: 'Ver Banho & Tosa', grupo: 'Banho & Tosa' },
  { id: 'pet:write', nome: 'Editar Banho & Tosa', grupo: 'Banho & Tosa' },
  { id: 'pet:workorder', nome: 'Gerenciar OS Pet', grupo: 'Banho & Tosa' },
  { id: 'reports:read', nome: 'Ver Relatórios', grupo: 'Relatórios' },
  { id: 'reports:export', nome: 'Exportar Relatórios', grupo: 'Relatórios' },
  { id: 'settings:read', nome: 'Ver Configurações', grupo: 'Configurações' },
  { id: 'settings:write', nome: 'Editar Configurações', grupo: 'Configurações' },
  { id: 'settings:danger', nome: 'Ações Perigosas', grupo: 'Configurações' },
  { id: 'settings:organization', nome: 'Organização', grupo: 'Configurações' },
  { id: 'settings:users', nome: 'Usuários', grupo: 'Configurações' },
  { id: 'settings:roles', nome: 'Papéis & Permissões', grupo: 'Configurações' },
  { id: 'settings:billing', nome: 'Plano & Faturamento', grupo: 'Configurações' },
  { id: 'settings:licenses', nome: 'Licenças & Ativação', grupo: 'Configurações' },
  { id: 'settings:units', nome: 'Unidades de Medida', grupo: 'Configurações' },
  { id: 'settings:categories', nome: 'Categorias', grupo: 'Configurações' },
  { id: 'settings:payments', nome: 'Métodos de Pagamento', grupo: 'Configurações' },
  { id: 'settings:import-export', nome: 'Importar/Exportar', grupo: 'Configurações' },
];

// API Functions

// Organization
export const getOrganization = async (): Promise<Organization> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.organization, DEFAULT_ORGANIZATION);
};

export const updateOrganization = async (data: Organization): Promise<Organization> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.organization, data);
  appendAuditEvent('organization.updated', { tenantId: data.tenantId, changes: data });
  return data;
};

// Branding
export const getBranding = async (): Promise<Branding> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.branding, DEFAULT_BRANDING);
};

export const updateBranding = async (data: Branding): Promise<Branding> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.branding, data);
  appendAuditEvent('branding.updated', data);
  return data;
};

// Users - Using only localStorage (prepared for future backend integration)
export const getUsers = async (): Promise<User[]> => {
  await delay(300);
  // Ler usuários do storage
  let users = getFromStorage(STORAGE_KEYS.users, DEFAULT_USERS);

  // Garantir que o usuário logado esteja presente como Admin para permitir acesso às configurações
  try {
    const authRaw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
    if (authRaw) {
      const auth = JSON.parse(authRaw || '{}');
      const email: string | undefined = auth?.email;
      const displayName: string | undefined = auth?.displayName;
      if (email && !users.some(u => u.email === email)) {
        const seeded: User = {
          id: `auth-${Date.now()}`,
          nome: displayName || email,
          email,
          roleId: 'admin',
          ativo: true,
        };
        users = [...users, seeded];
        setInStorage(STORAGE_KEYS.users, users);
      }
    }
  } catch {
    // Em caso de erro, mantém lista atual
  }

  return users;
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  await delay(500);
  const users = getFromStorage(STORAGE_KEYS.users, DEFAULT_USERS);
  const newUser = { ...user, id: Date.now().toString() };
  const updated = [...users, newUser];
  setInStorage(STORAGE_KEYS.users, updated);
  appendAuditEvent('user.created', { id: newUser.id, email: newUser.email });
  return newUser;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  await delay(500);
  const users = getFromStorage(STORAGE_KEYS.users, DEFAULT_USERS);
  const updated = users.map(u => u.id === id ? { ...u, ...data } : u);
  setInStorage(STORAGE_KEYS.users, updated);
  const updatedUser = updated.find(u => u.id === id);
  if (!updatedUser) {
    throw new Error('Usuário não encontrado');
  }
  appendAuditEvent('user.updated', { id, changes: data });
  return updatedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
  await delay(500);
  const users = getFromStorage(STORAGE_KEYS.users, DEFAULT_USERS);
  const updated = users.filter(u => u.id !== id);
  setInStorage(STORAGE_KEYS.users, updated);
  appendAuditEvent('user.deleted', { id });
};

// Roles - Using only localStorage (prepared for future backend integration)
export const getRoles = async (): Promise<Role[]> => {
  await delay(200);
  const tenantId = getTenantId();
  try {
    const res = await apiClient<{ data: any[] }>(`/tenants/${tenantId}/roles`, {
      method: 'GET',
      suppressErrorLog: true,
    });
    const roles = (res?.data || []).map((r: any) => ({
      id: r.id,
      nome: r.name || r.nome || 'Sem nome',
      permissions: (() => {
        try {
          if (Array.isArray(r.permissions)) return r.permissions as string[];
          if (typeof r.permissions === 'string') return JSON.parse(r.permissions || '[]');
          return [] as string[];
        } catch {
          return [] as string[];
        }
      })(),
    })) as Role[];
    return roles;
  } catch (err) {
    // Fallback para dados locais quando Hub estiver indisponível
    // Respeitar completamente o storage atual (não reintroduzir DEFAULT_ROLES removidos)
    const stored = getFromStorage<Role[] | null>(STORAGE_KEYS.roles, null);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    // Primeira execução sem storage: inicializar com DEFAULT_ROLES
    setInStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
    return DEFAULT_ROLES;
  }
};

export const createRole = async (role: Omit<Role, 'id'>): Promise<Role> => {
  await delay(200);
  const roles = getFromStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
  const newRole: Role = { ...role, id: Date.now().toString() };
  const updated = [...roles, newRole];
  setInStorage(STORAGE_KEYS.roles, updated);
  appendAuditEvent('role.created.offline', { id: newRole.id, nome: newRole.nome });
  return newRole;
};

export const updateRole = async (id: string, data: Partial<Role>): Promise<Role> => {
  await delay(200);
  const roles = getFromStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
  const updatedLocal = roles.map(r => r.id === id ? { ...r, ...data } : r);
  setInStorage(STORAGE_KEYS.roles, updatedLocal);
  const updatedRole = updatedLocal.find(r => r.id === id);
  if (!updatedRole) {
    throw new Error('Role não encontrada');
  }
  appendAuditEvent('role.updated.offline', { id, changes: data });
  return updatedRole;
};

export const deleteRole = async (id: string): Promise<void> => {
  await delay(200);
  const roles = getFromStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
  const updated = roles.filter(r => r.id !== id);
  setInStorage(STORAGE_KEYS.roles, updated);
  appendAuditEvent('role.deleted.offline', { id });
};

// Seats - Using only localStorage (prepared for future backend integration)
export const getSeats = async (): Promise<Seat[]> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
};

export const createSeat = async (seat: Omit<Seat, 'id' | 'criadoEm' | 'tipo' | 'email'>): Promise<Seat> => {
  await delay(500);
  const seats = getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
  const newSeat: Seat = { 
    ...seat, 
    id: Date.now().toString(),
    criadoEm: new Date().toISOString(),
    tipo: 'ASSENTO',
    email: (seat as any).email ?? `${String(seat.nome).replace(/\s+/g, '').toLowerCase()}@seat.local`
  };
  const updated = [...seats, newSeat];
  setInStorage(STORAGE_KEYS.seats, updated);
  appendAuditEvent('seat.created', { id: newSeat.id, nome: newSeat.nome });
  return newSeat;
};

export const updateSeat = async (id: string, data: Partial<Seat>): Promise<Seat> => {
  await delay(500);
  const seats = getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
  const updated = seats.map(s => s.id === id ? { ...s, ...data } : s);
  setInStorage(STORAGE_KEYS.seats, updated);
  const updatedSeat = updated.find(s => s.id === id);
  if (!updatedSeat) {
    throw new Error('Assento não encontrado');
  }
  appendAuditEvent('seat.updated', { id, changes: data });
  return updatedSeat;
};

export const deleteSeat = async (id: string): Promise<void> => {
  await delay(500);
  const seats = getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
  const updated = seats.filter(s => s.id !== id);
  setInStorage(STORAGE_KEYS.seats, updated);
  appendAuditEvent('seat.deleted', { id });
};

export const getSeatById = async (id: string): Promise<Seat | null> => {
  await delay(200);
  const seats = getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
  return seats.find(s => s.id === id) || null;
};

export const getActiveSeats = async (): Promise<Seat[]> => {
  await delay(300);
  const seats = await getSeats();
  return seats.filter(s => s.ativo);
};

export const getSeatsByRole = async (roleId: string): Promise<Seat[]> => {
  await delay(300);
  const seats = await getSeats();
  return seats.filter(s => s.roleId === roleId);
};

// Função para buscar assinatura ativa do tenant no Client-Local
const fetchTenantSubscription = async (tenantId: string) => {
  try {
    const response = await fetch(ENDPOINTS.CLIENT_PLANS_SUBSCRIPTION(tenantId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
    });

    if (response.ok) {
      const subscription = await response.json();
      return subscription;
    }
    
    return null;
  } catch (error) {
    console.warn('Erro ao buscar assinatura do Hub:', error);
    return null;
  }
};

// Plan
export const getPlanInfo = async (): Promise<PlanInfo> => {
  await delay(300);
  
  // Tentar buscar dados do Hub primeiro
  const tenantId = localStorage.getItem('2f.tenantId') || 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';
  const hubSubscription = await fetchTenantSubscription(tenantId);
  
  if (hubSubscription && hubSubscription.plan) {
    // Mapear dados do Hub para o formato esperado
    const planKey = hubSubscription.plan.name?.toLowerCase() || 'starter';
    const mappedPlan = ['starter', 'pro', 'max'].includes(planKey) ? planKey : 'starter';
    
    // Calcular próxima cobrança baseada na assinatura
    const nextBilling = hubSubscription.expiresAt 
      ? new Date(hubSubscription.expiresAt).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Mapear recursos do plano do Hub
    const planFeatures = hubSubscription.plan.featuresEnabled 
      ? (typeof hubSubscription.plan.featuresEnabled === 'string' 
         ? JSON.parse(hubSubscription.plan.featuresEnabled) 
         : hubSubscription.plan.featuresEnabled)
      : {};
    
    return {
      plano: mappedPlan as 'starter' | 'pro' | 'max',
      seatLimit: hubSubscription.plan.maxSeats || 1,
      recursos: {
        products: { enabled: planFeatures.products !== false },
        pdv: { enabled: planFeatures.pdv !== false },
        stock: { enabled: planFeatures.stock !== false },
        agenda: { enabled: planFeatures.agenda !== false },
        banho_tosa: { enabled: planFeatures.banho_tosa !== false },
        reports: { enabled: planFeatures.reports !== false },
      },
      ciclo: 'MENSAL' as 'MENSAL' | 'ANUAL', // Por enquanto assumindo mensal
      proximoCobranca: nextBilling,
    };
  }
  
  // Fallback para dados locais se o Hub não estiver disponível
  const plan = getCurrentPlan();
  const entitlements = getEntitlements();
  const cycle = getFromStorage(STORAGE_KEYS.planCycle, 'MENSAL' as 'MENSAL' | 'ANUAL');
  
  return {
    plano: plan,
    seatLimit: entitlements.seatLimit,
    recursos: {
      products: { enabled: entitlements.products },
      pdv: { enabled: entitlements.pdv },
      stock: { enabled: entitlements.stock },
      agenda: { enabled: entitlements.agenda },
      banho_tosa: { enabled: entitlements.banho_tosa },
      reports: { enabled: entitlements.reports },
    },
    ciclo: cycle,
    proximoCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

export const updatePlan = async (planKey: 'starter' | 'pro' | 'max') => {
  const tenantId = localStorage.getItem('2f.tenantId') || 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';
  const userId = localStorage.getItem('user_id') || 'unknown';
  
  try {
    // Usar PlanSyncService para sincronização completa
    const { PlanSyncService } = await import('../services/plan-sync.service');
    const result = await PlanSyncService.syncPlansAfterPlanChange(tenantId, userId, planKey);
    
    if (result.success) {
      console.log('Plan synchronized successfully across all services');
    } else {
      console.warn('Plan synchronization completed with some issues:', result.errors);
    }
  } catch (error) {
    console.warn('PlanSyncService not available, using fallback:', error);
    
    // Fallback para localStorage se o serviço não estiver disponível
    localStorage.setItem('selectedPlan', planKey);
  }
  
  // Disparar evento customizado para notificar outras partes da aplicação
  window.dispatchEvent(new CustomEvent('planChanged', { detail: { planKey } }));
};

// License (mock UI only)
export const getLicenseInfo = async (): Promise<LicenseInfo> => {
  await delay(300);
  return {
    licenseKey: '2F-DEMO-XXXX-XXXX-XXXX',
    status: 'ACTIVE',
    expiracao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    dispositivosAtivos: 1,
  };
};

// API Keys
export const getApiKeys = async (): Promise<ApiKey[]> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.apiKeys, []);
};

export const createApiKey = async (nome: string): Promise<{ key: ApiKey; fullToken: string }> => {
  await delay(500);
  const keys = getFromStorage(STORAGE_KEYS.apiKeys, []);
  const fullToken = `2F-${Math.random().toString(36).substring(2, 15).toUpperCase()}-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  const newKey: ApiKey = {
    id: Date.now().toString(),
    nome,
    tokenPrefix: fullToken.substring(0, 10) + '...',
    criadoEm: new Date().toISOString(),
  };
  const updated = [...keys, newKey];
  setInStorage(STORAGE_KEYS.apiKeys, updated);
  return { key: newKey, fullToken };
};

export const deleteApiKey = async (id: string): Promise<void> => {
  await delay(500);
  const keys = getFromStorage(STORAGE_KEYS.apiKeys, []);
  const updated = keys.filter(k => k.id !== id);
  setInStorage(STORAGE_KEYS.apiKeys, updated);
};

// Webhooks
export const getWebhooks = async (): Promise<Webhook[]> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.webhooks, []);
};

export const createWebhook = async (webhook: Omit<Webhook, 'id'>): Promise<Webhook> => {
  await delay(500);
  const webhooks = getFromStorage(STORAGE_KEYS.webhooks, []);
  const newWebhook = { ...webhook, id: Date.now().toString() };
  const updated = [...webhooks, newWebhook];
  setInStorage(STORAGE_KEYS.webhooks, updated);
  return newWebhook;
};

export const updateWebhook = async (id: string, data: Partial<Webhook>): Promise<Webhook> => {
  await delay(500);
  const webhooks = getFromStorage(STORAGE_KEYS.webhooks, []);
  const updated = webhooks.map(w => w.id === id ? { ...w, ...data } : w);
  setInStorage(STORAGE_KEYS.webhooks, updated);
  return updated.find(w => w.id === id)!;
};

export const deleteWebhook = async (id: string): Promise<void> => {
  await delay(500);
  const webhooks = getFromStorage(STORAGE_KEYS.webhooks, []);
  const updated = webhooks.filter(w => w.id !== id);
  setInStorage(STORAGE_KEYS.webhooks, updated);
};

// Preferences
export const getPosPrefs = async (): Promise<PosPrefs> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.posPrefs, { impressora: 'nenhuma', reciboAuto: false, abrirGaveta: false });
};

export const updatePosPrefs = async (data: PosPrefs): Promise<PosPrefs> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.posPrefs, data);
  appendAuditEvent('posPrefs.updated', data);
  return data;
};

export const getAgendaPrefs = async (): Promise<AgendaPrefs> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.agendaPrefs, { intervaloPadraoMin: 30, permitirDuploAgendamento: false });
};

export const updateAgendaPrefs = async (data: AgendaPrefs): Promise<AgendaPrefs> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.agendaPrefs, data);
  appendAuditEvent('agendaPrefs.updated', data);
  return data;
};

export const getPetPrefs = async (): Promise<PetPrefs> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.petPrefs, { banhoDuracaoMin: 45, tosaDuracaoMin: 90, pedirAssinaturaTermo: true });
};

export const updatePetPrefs = async (data: PetPrefs): Promise<PetPrefs> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.petPrefs, data);
  appendAuditEvent('petPrefs.updated', data);
  return data;
};

export const getStockPrefs = async (): Promise<StockPrefs> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.stockPrefs, { estoqueMinimoPadrao: 10, bloquearVendaSemEstoque: true });
};

export const updateStockPrefs = async (data: StockPrefs): Promise<StockPrefs> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.stockPrefs, data);
  appendAuditEvent('stockPrefs.updated', data);
  return data;
};

// Audit
export const getAuditEvents = async (): Promise<AuditEvent[]> => {
  await delay(300);
  const events = getFromStorage<AuditEvent[]>(STORAGE_KEYS.auditEvents, []);
  return events.sort((a, b) => (a.data < b.data ? 1 : -1));
};

// Import/Export (mock)
export const exportData = async (type: 'products' | 'customers'): Promise<string> => {
  await delay(1000);
  const csv = type === 'products' 
    ? 'ID,Nome,Categoria,Preço\n1,Produto A,Cat1,99.90\n2,Produto B,Cat2,149.90'
    : 'ID,Nome,Email,Telefone\n1,Cliente A,clientea@example.com,(11)99999-9999\n2,Cliente B,clienteb@example.com,(11)88888-8888';
  return csv;
};

export const importData = async (file: File): Promise<{ success: number; errors: number }> => {
  await delay(2000);
  // Mock: assume 10 linhas, 8 sucesso, 2 erros
  return { success: 8, errors: 2 };
};

// Danger
export const resetDemoData = async (): Promise<void> => {
  await delay(1000);
  // Mock: não faz nada de verdade
};
// Current user permissions helper
export const getCurrentPermissions = (): string[] => {
  try {
    const authRaw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
    const email = authRaw ? (JSON.parse(authRaw || '{}')?.email as string | undefined) : undefined;
    const users = getFromStorage<User[]>(STORAGE_KEYS.users, DEFAULT_USERS);
    // Mesclar papéis em memória com DEFAULT_ROLES para garantir novas permissões
    const storedRoles = getFromStorage<Role[]>(STORAGE_KEYS.roles, DEFAULT_ROLES);
    const defaultMap = new Map(DEFAULT_ROLES.map(r => [r.id, r]));
    const rolesMap = new Map(storedRoles.map(r => [r.id, r]));

    for (const [id, def] of defaultMap.entries()) {
      const existing = rolesMap.get(id);
      if (existing) {
        const mergedPerms = Array.from(new Set([...(existing.permissions || []), ...(def.permissions || [])]));
        rolesMap.set(id, { ...existing, permissions: mergedPerms, nome: existing.nome || def.nome });
      } else {
        rolesMap.set(id, def);
      }
    }

    const roles = Array.from(rolesMap.values());
    const current = email ? users.find(u => u.email === email) : users[0];
    const role = roles.find(r => r.id === (current?.roleId || 'admin'));
    return role?.permissions || [];
  } catch {
    return [];
  }
};
