// ============================================
// GROOMING API - Real API Integration
// ============================================

// ============ TYPES ============

export interface Tutor {
  id: string;
  clienteId?: string; // FK para Cliente da Agenda
  nome: string;
  telefone: string;
  email?: string;
  documento?: string;
  endereco?: string;
  notas?: string;
  ativo: boolean;
}

export type Especie = 'CACHORRO' | 'GATO';
export type Porte = 'PP' | 'P' | 'M' | 'G' | 'GG';
export type TipoPelo = 'CURTO' | 'MEDIO' | 'LONGO' | 'DUAS_CAMADAS' | 'POODLE';
export type Temperamento = 'DOCIL' | 'REATIVO' | 'AGRESSIVO' | 'ANSIOSO' | 'DESCONHECIDO';

export interface Pet {
  id: string;
  tutorId: string;
  nome: string;
  especie: Especie;
  raca?: string;
  porte: Porte;
  tipoPelo: TipoPelo;
  idadeMeses?: number;
  pesoKg?: number;
  temperamento: Temperamento;
  alergias?: string;
  restricoes?: string;
  ultimaVacinaAntirrabica?: string; // ISO date
  antipulgasEm?: string; // ISO date
  observacoes?: string;
  fotos?: string[];
  ativo: boolean;
}

export type ServiceCategory = 'BANHO' | 'TOSA' | 'HIGIENE' | 'HIDRATACAO' | 'COMBO' | 'OUTROS';

export interface ServiceCategoryConfig {
  id: string;
  value: ServiceCategory;
  label: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface GroomService {
  id: string;
  nome: string;
  descricao?: string;
  categoria: ServiceCategory;
  precoPorPorte: {
    PP: number;
    P: number;
    M: number;
    G: number;
    GG: number;
  };
  duracaoBaseMin: number;
  requerRecurso?: string | null;
  cor?: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export type ResourceType = 'BOX' | 'GAIOLA' | 'MESA' | 'SECADOR';

export interface GroomResource {
  id: string;
  tipo: ResourceType;
  nome: string;
  capacidadeSimultanea: number;
  ativo: boolean;
}

export type TicketStatus = 'CHECKIN' | 'BANHO' | 'SECAGEM' | 'TOSA' | 'FINALIZACAO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
export type TicketOrigem = 'AGENDADO' | 'WALKIN';
export type IncidentType = 'CORTE' | 'REACAO' | 'FUGA' | 'OUTRO';

export interface GroomTicket {
  id: string;
  code: string;
  petId: string;
  tutorId: string;
  status: TicketStatus;
  totalPrice: number;
  notes?: string;
  items: Array<{
    id?: string;
    serviceId?: string;
    productId?: string;
    name: string;
    price: number;
    qty: number;
    subtotal?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroomPrefs {
  portes: Porte[];
  tabelaTempoMin?: { BANHO: number; SECAGEM: number; TOSA: number };
  obrigarAssinaturaTermo: boolean;
  permitirOverbooking: boolean;
  notificarQuandoPronto: boolean;
  templateTermo: string;
  impressao: {
    habilitarEtiqueta: boolean;
    incluirQR: boolean;
  };
}

// ============ API CONFIGURATION ============
import { API_URLS } from './env';
const API_BASE_URL = API_URLS.CLIENT_LOCAL;

// ============ API HELPER ============
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============ STORAGE KEYS (for local preferences) ============
const STORAGE_KEYS = {
  TUTORS: 'grooming_tutors',
  PETS: 'grooming_pets',
  PREFS: 'grooming_prefs',
  CATEGORIES: 'grooming_categories',
};

// ============ HELPERS ============
function uuid(): string {
  return crypto.randomUUID();
}

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ============ INIT MOCK DATA (for local data only) ============
export function initGroomingMockData(): void {
  // Init Prefs
  if (!localStorage.getItem(STORAGE_KEYS.PREFS)) {
    const mockPrefs: GroomPrefs = {
      portes: ['PP', 'P', 'M', 'G', 'GG'],
      tabelaTempoMin: { BANHO: 60, SECAGEM: 30, TOSA: 90 },
      obrigarAssinaturaTermo: false,
      permitirOverbooking: false,
      notificarQuandoPronto: true,
      templateTermo: 'Declaro que meu pet está em boas condições de saúde...',
      impressao: {
        habilitarEtiqueta: true,
        incluirQR: false,
      },
    };
    setStorage(STORAGE_KEYS.PREFS, mockPrefs);
  }

  // Init local tutors and pets (these could be moved to API later)
  if (!localStorage.getItem(STORAGE_KEYS.TUTORS)) {
    const mockTutors: Tutor[] = [
      {
        id: uuid(),
        nome: 'Maria Silva',
        telefone: '(11) 99999-1111',
        email: 'maria@email.com',
        ativo: true,
      },
      {
        id: uuid(),
        nome: 'João Santos',
        telefone: '(11) 99999-2222',
        email: 'joao@email.com',
        ativo: true,
      },
    ];
    setStorage(STORAGE_KEYS.TUTORS, mockTutors);
  }

  if (!localStorage.getItem(STORAGE_KEYS.PETS)) {
    const tutors = getTutors();
    const mockPets: Pet[] = [
      {
        id: uuid(),
        tutorId: tutors[0]?.id || '',
        nome: 'Rex',
        especie: 'CACHORRO',
        raca: 'Golden Retriever',
        porte: 'G',
        tipoPelo: 'LONGO',
        temperamento: 'DOCIL',
        ativo: true,
      },
      {
        id: uuid(),
        tutorId: tutors[1]?.id || '',
        nome: 'Mimi',
        especie: 'GATO',
        raca: 'Persa',
        porte: 'P',
        tipoPelo: 'LONGO',
        temperamento: 'DOCIL',
        ativo: true,
      },
    ];
    setStorage(STORAGE_KEYS.PETS, mockPets);
  }

  // Init tickets with example data
  if (!localStorage.getItem('grooming_tickets')) {
    const tutors = getTutors();
    const pets = getPets();
    const services = getGroomServices();
    
    if (tutors.length > 0 && pets.length > 0 && services.length > 0) {
      const mockTickets: GroomTicket[] = [
        {
          id: uuid(),
          code: `GT${Date.now().toString().slice(-6)}`,
          petId: pets[0].id,
          tutorId: tutors[0].id,
          status: 'CHECKIN',
          totalPrice: 65,
          notes: 'Pet muito dócil, sem restrições',
          items: [
            {
              id: uuid(),
              serviceId: services[1]?.id,
              name: 'Banho + Tosa Higiênica',
              price: 65,
              qty: 1,
              subtotal: 65,
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuid(),
          code: `GT${(Date.now() + 1000).toString().slice(-6)}`,
          petId: pets[1]?.id || pets[0].id,
          tutorId: tutors[1]?.id || tutors[0].id,
          status: 'BANHO',
          totalPrice: 45,
          notes: 'Gato nervoso, cuidado ao manusear',
          items: [
            {
              id: uuid(),
              serviceId: services[0]?.id,
              name: 'Banho Simples',
              price: 30,
              qty: 1,
              subtotal: 30,
            },
            {
              id: uuid(),
              serviceId: services[3]?.id,
              name: 'Hidratação',
              price: 15,
              qty: 1,
              subtotal: 15,
            }
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updatedAt: new Date().toISOString(),
        }
      ];
      setStorage('grooming_tickets', mockTickets);
    }
  }
}

// ============ TUTORS API (Local for now) ============
export function getTutors(): Tutor[] {
  const tutors = getStorage<Tutor[]>(STORAGE_KEYS.TUTORS, []);
  return Array.isArray(tutors) ? tutors : [];
}

export function getTutorById(id: string): Tutor | undefined {
  return getTutors().find((t) => t.id === id);
}

export function createTutor(data: Omit<Tutor, 'id'>): Tutor {
  const tutor: Tutor = { id: uuid(), ...data };
  const tutors = getTutors();
  tutors.push(tutor);
  setStorage(STORAGE_KEYS.TUTORS, tutors);
  return tutor;
}

export function updateTutor(id: string, data: Partial<Omit<Tutor, 'id'>>): void {
  const tutors = getTutors();
  const index = tutors.findIndex((t) => t.id === id);
  if (index !== -1) {
    tutors[index] = { ...tutors[index], ...data };
    setStorage(STORAGE_KEYS.TUTORS, tutors);
  }
}

export function deleteTutor(id: string): void {
  const tutors = getTutors().filter((t) => t.id !== id);
  setStorage(STORAGE_KEYS.TUTORS, tutors);
}

// ============ PETS API (Local for now) ============
export function getPets(): Pet[] {
  const pets = getStorage<Pet[]>(STORAGE_KEYS.PETS, []);
  return Array.isArray(pets) ? pets : [];
}

export function getPetById(id: string): Pet | undefined {
  return getPets().find((p) => p.id === id);
}

export function createPet(data: Omit<Pet, 'id'>): Pet {
  const pet: Pet = { id: uuid(), ...data };
  const pets = getPets();
  pets.push(pet);
  setStorage(STORAGE_KEYS.PETS, pets);
  return pet;
}

export function updatePet(id: string, data: Partial<Omit<Pet, 'id'>>): void {
  const pets = getPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index !== -1) {
    pets[index] = { ...pets[index], ...data };
    setStorage(STORAGE_KEYS.PETS, pets);
  }
}

export function deletePet(id: string): void {
  const pets = getPets().filter((p) => p.id !== id);
  setStorage(STORAGE_KEYS.PETS, pets);
}

// ============ SERVICES API ============
export function getGroomServices(): GroomService[] {
  const services = getStorage<GroomService[]>('grooming_services', [
    { 
      id: uuid(), 
      nome: 'Banho Simples', 
      descricao: 'Banho com shampoo neutro', 
      categoria: 'BANHO',
      precoPorPorte: { PP: 25, P: 30, M: 35, G: 40, GG: 45 },
      duracaoBaseMin: 60,
      ativo: true 
    },
    { 
      id: uuid(), 
      nome: 'Banho + Tosa Higiênica', 
      descricao: 'Banho completo com tosa higiênica', 
      categoria: 'COMBO',
      precoPorPorte: { PP: 35, P: 45, M: 55, G: 65, GG: 75 },
      duracaoBaseMin: 90,
      ativo: true 
    },
    { 
      id: uuid(), 
      nome: 'Tosa Completa', 
      descricao: 'Tosa na tesoura ou máquina', 
      categoria: 'TOSA',
      precoPorPorte: { PP: 45, P: 60, M: 75, G: 90, GG: 105 },
      duracaoBaseMin: 120,
      ativo: true 
    },
    { 
      id: uuid(), 
      nome: 'Hidratação', 
      descricao: 'Tratamento hidratante para pelos ressecados', 
      categoria: 'HIDRATACAO',
      precoPorPorte: { PP: 20, P: 25, M: 30, G: 35, GG: 40 },
      duracaoBaseMin: 45,
      ativo: true 
    },
  ]);
  return Array.isArray(services) ? services : [];
}

export function getGroomServiceById(id: string): GroomService | undefined {
  return getGroomServices().find((s) => s.id === id);
}

export function createGroomService(data: Omit<GroomService, 'id' | 'criadoEm' | 'atualizadoEm'>): GroomService {
  const service: GroomService = { 
    id: uuid(), 
    ...data,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  const services = getGroomServices();
  services.push(service);
  setStorage('grooming_services', services);
  return service;
}

export function updateGroomService(id: string, data: Partial<Omit<GroomService, 'id' | 'criadoEm' | 'atualizadoEm'>>): GroomService | undefined {
  const services = getGroomServices();
  const index = services.findIndex((s) => s.id === id);
  if (index !== -1) {
    services[index] = { 
      ...services[index], 
      ...data,
      atualizadoEm: new Date().toISOString()
    };
    setStorage('grooming_services', services);
    return services[index];
  }
  return undefined;
}

export function deleteGroomService(id: string): GroomService | undefined {
  const services = getGroomServices();
  const index = services.findIndex((s) => s.id === id);
  if (index !== -1) {
    const deletedService = services[index];
    services.splice(index, 1);
    setStorage('grooming_services', services);
    return deletedService;
  }
  return undefined;
}

export function duplicateGroomService(id: string): GroomService | undefined {
  const service = getGroomServiceById(id);
  if (service) {
    return createGroomService({ ...service, nome: `${service.nome} (Cópia)` });
  }
  return undefined;
}

// ============ PROFESSIONALS API ============
export function getProfessionals(): Professional[] {
  const professionals = getStorage<Professional[]>('grooming_professionals', [
    { id: uuid(), name: 'Maria Silva', role: 'Tosadora', phone: '(11) 99999-1111', email: 'maria@petshop.com', active: true },
    { id: uuid(), name: 'João Santos', role: 'Banhista', phone: '(11) 99999-2222', email: 'joao@petshop.com', active: true },
    { id: uuid(), name: 'Ana Costa', role: 'Veterinária', phone: '(11) 99999-3333', email: 'ana@petshop.com', active: true },
  ]);
  return Array.isArray(professionals) ? professionals : [];
}

export function getProfessionalById(id: string): Professional | undefined {
  return getProfessionals().find((p) => p.id === id);
}

export function createProfessional(data: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>): Professional {
  const professional: Professional = { 
    id: uuid(), 
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const professionals = getProfessionals();
  professionals.push(professional);
  setStorage('grooming_professionals', professionals);
  return professional;
}

export function updateProfessional(id: string, data: Partial<Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>>): Professional | undefined {
  const professionals = getProfessionals();
  const index = professionals.findIndex((p) => p.id === id);
  if (index !== -1) {
    professionals[index] = { 
      ...professionals[index], 
      ...data,
      updatedAt: new Date().toISOString()
    };
    setStorage('grooming_professionals', professionals);
    return professionals[index];
  }
  return undefined;
}

export function deleteProfessional(id: string): Professional | undefined {
  const professionals = getProfessionals();
  const index = professionals.findIndex((p) => p.id === id);
  if (index !== -1) {
    const deletedProfessional = professionals[index];
    professionals.splice(index, 1);
    setStorage('grooming_professionals', professionals);
    return deletedProfessional;
  }
  return undefined;
}

// ============ RESOURCES API ============
export function getGroomResources(): GroomResource[] {
  const resources = getStorage<GroomResource[]>('grooming_resources', [
    { id: uuid(), tipo: 'BOX', nome: 'Box 1', capacidadeSimultanea: 1, ativo: true },
    { id: uuid(), tipo: 'BOX', nome: 'Box 2', capacidadeSimultanea: 1, ativo: true },
    { id: uuid(), tipo: 'MESA', nome: 'Mesa 1', capacidadeSimultanea: 1, ativo: true },
    { id: uuid(), tipo: 'SECADOR', nome: 'Secador 1', capacidadeSimultanea: 2, ativo: true },
  ]);
  return Array.isArray(resources) ? resources : [];
}

export function getGroomResourceById(id: string): GroomResource | undefined {
  return getGroomResources().find((r) => r.id === id);
}

export function createGroomResource(data: Omit<GroomResource, 'id'>): GroomResource {
  const resource: GroomResource = { id: uuid(), ...data };
  const resources = getGroomResources();
  resources.push(resource);
  setStorage('grooming_resources', resources);
  return resource;
}

export function updateGroomResource(id: string, data: Partial<Omit<GroomResource, 'id'>>): void {
  const resources = getGroomResources();
  const index = resources.findIndex((r) => r.id === id);
  if (index !== -1) {
    resources[index] = { ...resources[index], ...data };
    setStorage('grooming_resources', resources);
  }
}

export function deleteGroomResource(id: string): void {
  const resources = getGroomResources().filter((r) => r.id !== id);
  setStorage('grooming_resources', resources);
}

// ============ TICKETS API (Local for now) ============
export function getGroomTickets(): GroomTicket[] {
  const tickets = getStorage<GroomTicket[]>('grooming_tickets', []);
  return Array.isArray(tickets) ? tickets : [];
}

export function getGroomTicketById(id: string): GroomTicket | undefined {
  return getGroomTickets().find((t) => t.id === id);
}

export function createGroomTicket(data: Omit<GroomTicket, 'id' | 'code' | 'createdAt' | 'updatedAt'>): GroomTicket {
  const ticket: GroomTicket = {
    id: uuid(),
    code: `GT${Date.now().toString().slice(-6)}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const tickets = getGroomTickets();
  tickets.push(ticket);
  setStorage('grooming_tickets', tickets);
  return ticket;
}

export function updateGroomTicket(id: string, data: Partial<Omit<GroomTicket, 'id' | 'code' | 'createdAt' | 'updatedAt'>>): GroomTicket | undefined {
  const tickets = getGroomTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index !== -1) {
    tickets[index] = {
      ...tickets[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setStorage('grooming_tickets', tickets);
    return tickets[index];
  }
  return undefined;
}

export function deleteGroomTicket(id: string): GroomTicket | undefined {
  const tickets = getGroomTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (ticket) {
    const filteredTickets = tickets.filter((t) => t.id !== id);
    setStorage('grooming_tickets', filteredTickets);
    return ticket;
  }
  return undefined;
}

// ============ PREFS API (Local) ============
export function getGroomPrefs(): GroomPrefs {
  return getStorage<GroomPrefs>(STORAGE_KEYS.PREFS, {
    portes: ['PP', 'P', 'M', 'G', 'GG'],
    tabelaTempoMin: { BANHO: 60, SECAGEM: 30, TOSA: 90 },
    obrigarAssinaturaTermo: false,
    permitirOverbooking: false,
    notificarQuandoPronto: true,
    templateTermo: 'Declaro que meu pet está em boas condições de saúde...',
    impressao: {
      habilitarEtiqueta: true,
      incluirQR: false,
    },
  });
}

export function saveGroomPrefs(prefs: GroomPrefs): void {
  setStorage(STORAGE_KEYS.PREFS, prefs);
}

// ============ CATEGORIES API ============
export function getServiceCategories(): ServiceCategoryConfig[] {
  const categories = getStorage<ServiceCategoryConfig[]>(STORAGE_KEYS.CATEGORIES, [
    { 
      id: uuid(), 
      value: 'BANHO', 
      label: 'Banho', 
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    },
    { 
      id: uuid(), 
      value: 'TOSA', 
      label: 'Tosa', 
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    },
    { 
      id: uuid(), 
      value: 'HIGIENE', 
      label: 'Higiene', 
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    },
    { 
      id: uuid(), 
      value: 'HIDRATACAO', 
      label: 'Hidratação', 
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    },
    { 
      id: uuid(), 
      value: 'COMBO', 
      label: 'Combo', 
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    },
    { 
      id: uuid(), 
      value: 'OUTROS', 
      label: 'Outros', 
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    },
  ]);
  return Array.isArray(categories) ? categories : [];
}

export function getServiceCategoryById(id: string): ServiceCategoryConfig | undefined {
  return getServiceCategories().find((c) => c.id === id);
}

export function createServiceCategory(data: Omit<ServiceCategoryConfig, 'id' | 'criadoEm' | 'atualizadoEm'>): ServiceCategoryConfig {
  const category: ServiceCategoryConfig = { 
    id: uuid(), 
    ...data,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  const categories = getServiceCategories();
  categories.push(category);
  setStorage(STORAGE_KEYS.CATEGORIES, categories);
  return category;
}

export function updateServiceCategory(id: string, data: Partial<Omit<ServiceCategoryConfig, 'id' | 'criadoEm' | 'atualizadoEm'>>): ServiceCategoryConfig | undefined {
  const categories = getServiceCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index !== -1) {
    categories[index] = { 
      ...categories[index], 
      ...data,
      atualizadoEm: new Date().toISOString()
    };
    setStorage(STORAGE_KEYS.CATEGORIES, categories);
    return categories[index];
  }
  return undefined;
}

export function deleteServiceCategory(id: string): ServiceCategoryConfig | undefined {
  const categories = getServiceCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index !== -1) {
    const deletedCategory = categories[index];
    categories.splice(index, 1);
    setStorage(STORAGE_KEYS.CATEGORIES, categories);
    return deletedCategory;
  }
  return undefined;
}

// Initialize on load
initGroomingMockData();
