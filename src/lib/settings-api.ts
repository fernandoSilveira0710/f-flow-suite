/**
 * API Mock para Settings (simula API Routes)
 * Futuramente apontará para 2F License Hub via VITE_LICENSE_HUB_URL
 */

import { getCurrentPlan, setPlan as setEntitlementsPlan, getEntitlements } from './entitlements';

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
      'pos:read', 'pos:checkout', 'pos:refund',
      'stock:read', 'stock:adjust', 'stock:purchase_order',
      'agenda:read', 'agenda:write', 'agenda:cancel',
      'pet:read', 'pet:write', 'pet:workorder',
      'reports:read', 'reports:export',
      'settings:read', 'settings:write', 'settings:danger',
    ],
  },
  {
    id: 'vendedor',
    nome: 'Vendedor',
    permissions: ['products:read', 'pos:read', 'pos:checkout', 'stock:read'],
  },
  {
    id: 'estoquista',
    nome: 'Estoquista',
    permissions: ['products:read', 'stock:read', 'stock:adjust', 'stock:purchase_order'],
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
  { id: 'stock:read', nome: 'Ver Estoque', grupo: 'Estoque' },
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
  return data;
};

// Users - Using only localStorage (prepared for future backend integration)
export const getUsers = async (): Promise<User[]> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.users, DEFAULT_USERS);
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  await delay(500);
  const users = getFromStorage(STORAGE_KEYS.users, DEFAULT_USERS);
  const newUser = { ...user, id: Date.now().toString() };
  const updated = [...users, newUser];
  setInStorage(STORAGE_KEYS.users, updated);
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
  return updatedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
  await delay(500);
  const users = getFromStorage(STORAGE_KEYS.users, DEFAULT_USERS);
  const updated = users.filter(u => u.id !== id);
  setInStorage(STORAGE_KEYS.users, updated);
};

// Roles - Using only localStorage (prepared for future backend integration)
export const getRoles = async (): Promise<Role[]> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
};

export const createRole = async (role: Omit<Role, 'id'>): Promise<Role> => {
  await delay(500);
  const roles = getFromStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
  const newRole = { ...role, id: Date.now().toString() };
  const updated = [...roles, newRole];
  setInStorage(STORAGE_KEYS.roles, updated);
  return newRole;
};

export const updateRole = async (id: string, data: Partial<Role>): Promise<Role> => {
  await delay(500);
  const roles = getFromStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
  const updated = roles.map(r => r.id === id ? { ...r, ...data } : r);
  setInStorage(STORAGE_KEYS.roles, updated);
  const updatedRole = updated.find(r => r.id === id);
  if (!updatedRole) {
    throw new Error('Role não encontrada');
  }
  return updatedRole;
};

export const deleteRole = async (id: string): Promise<void> => {
  await delay(500);
  const roles = getFromStorage(STORAGE_KEYS.roles, DEFAULT_ROLES);
  const updated = roles.filter(r => r.id !== id);
  setInStorage(STORAGE_KEYS.roles, updated);
};

// Seats - Using only localStorage (prepared for future backend integration)
export const getSeats = async (): Promise<Seat[]> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
};

export const createSeat = async (seat: Omit<Seat, 'id' | 'criadoEm'>): Promise<Seat> => {
  await delay(500);
  const seats = getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
  const newSeat: Seat = { 
    ...seat, 
    id: Date.now().toString(),
    criadoEm: new Date().toISOString(),
    tipo: 'ASSENTO'
  };
  const updated = [...seats, newSeat];
  setInStorage(STORAGE_KEYS.seats, updated);
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
  return updatedSeat;
};

export const deleteSeat = async (id: string): Promise<void> => {
  await delay(500);
  const seats = getFromStorage(STORAGE_KEYS.seats, DEFAULT_SEATS);
  const updated = seats.filter(s => s.id !== id);
  setInStorage(STORAGE_KEYS.seats, updated);
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

// Função para buscar assinatura ativa do tenant no Hub
const fetchTenantSubscription = async (tenantId: string) => {
  try {
    const response = await fetch(`http://localhost:8081/plans/tenants/${tenantId}/subscription`, {
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
  const tenantId = localStorage.getItem('2f.tenantId') || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
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
  const tenantId = localStorage.getItem('2f.tenantId') || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
  
  try {
    // 1. Tentar atualizar no Hub primeiro
    const hubResponse = await fetch(`http://localhost:8081/tenants/${tenantId}/subscription`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ 
        planId: planKey,
        status: 'active'
      }),
    });

    if (hubResponse.ok) {
      console.log('Plan updated successfully in Hub');
      
      // 2. Tentar sincronizar com o client-local
      try {
        const clientLocalResponse = await fetch('http://localhost:3010/licensing/sync-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tenantId,
            planKey 
          }),
        });

        if (clientLocalResponse.ok) {
          console.log('Plan synchronized successfully with client-local');
        } else {
          console.warn('Failed to sync with client-local, but Hub update succeeded');
        }
      } catch (clientError) {
        console.warn('Client-local not available for sync, but Hub update succeeded:', clientError);
      }
    } else {
      console.warn('Failed to update plan in Hub, trying client-local fallback');
      
      // 3. Fallback para client-local se Hub falhar
      const clientLocalResponse = await fetch('http://localhost:3010/licensing/sync-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tenantId,
          planKey 
        }),
      });

      if (clientLocalResponse.ok) {
        console.log('Plan updated successfully in client-local (Hub fallback)');
      } else {
        console.warn('Both Hub and client-local failed, using localStorage fallback');
      }
    }
  } catch (error) {
    console.warn('Hub not available, trying client-local fallback:', error);
    
    try {
      // Fallback para client-local se Hub não estiver disponível
      const clientLocalResponse = await fetch('http://localhost:3010/licensing/sync-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tenantId,
          planKey 
        }),
      });

      if (clientLocalResponse.ok) {
        console.log('Plan updated successfully in client-local (Hub offline)');
      } else {
        console.warn('Both services unavailable, using localStorage fallback');
      }
    } catch (clientError) {
      console.warn('All services unavailable, using localStorage fallback:', clientError);
    }
  }

  // Atualizar localStorage como fallback final ou confirmação
  localStorage.setItem('selectedPlan', planKey);
  
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
  return data;
};

export const getAgendaPrefs = async (): Promise<AgendaPrefs> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.agendaPrefs, { intervaloPadraoMin: 30, permitirDuploAgendamento: false });
};

export const updateAgendaPrefs = async (data: AgendaPrefs): Promise<AgendaPrefs> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.agendaPrefs, data);
  return data;
};

export const getPetPrefs = async (): Promise<PetPrefs> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.petPrefs, { banhoDuracaoMin: 45, tosaDuracaoMin: 90, pedirAssinaturaTermo: true });
};

export const updatePetPrefs = async (data: PetPrefs): Promise<PetPrefs> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.petPrefs, data);
  return data;
};

export const getStockPrefs = async (): Promise<StockPrefs> => {
  await delay(300);
  return getFromStorage(STORAGE_KEYS.stockPrefs, { estoqueMinimoPadrao: 10, bloquearVendaSemEstoque: true });
};

export const updateStockPrefs = async (data: StockPrefs): Promise<StockPrefs> => {
  await delay(500);
  setInStorage(STORAGE_KEYS.stockPrefs, data);
  return data;
};

// Audit
export const getAuditEvents = async (): Promise<AuditEvent[]> => {
  await delay(300);
  return [
    { id: '1', data: new Date().toISOString(), tipo: 'user.created', usuario: 'admin@demo.com', payload: '{"nome":"João Silva"}' },
    { id: '2', data: new Date(Date.now() - 86400000).toISOString(), tipo: 'product.updated', usuario: 'admin@demo.com', payload: '{"id":"123","nome":"Produto X"}' },
    { id: '3', data: new Date(Date.now() - 172800000).toISOString(), tipo: 'plan.changed', usuario: 'admin@demo.com', payload: '{"from":"starter","to":"pro"}' },
    { id: '4', data: new Date(Date.now() - 259200000).toISOString(), tipo: 'settings.updated', usuario: 'admin@demo.com', payload: '{"section":"organization"}' },
    { id: '5', data: new Date(Date.now() - 345600000).toISOString(), tipo: 'user.deleted', usuario: 'admin@demo.com', payload: '{"id":"999"}' },
  ];
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
