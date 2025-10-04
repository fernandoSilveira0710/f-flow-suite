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

export interface GroomService {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ResourceType = 'BOX' | 'GAIOLA' | 'MESA' | 'SECADOR';

export interface GroomResource {
  id: string;
  tipo: ResourceType;
  nome: string;
  capacidadeSimultanea: number;
  ativo: boolean;
}

export type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
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
const API_BASE_URL = 'http://127.0.0.1:3010';

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
}

// ============ TUTORS API (Local for now) ============
export function getTutors(): Tutor[] {
  return getStorage<Tutor[]>(STORAGE_KEYS.TUTORS, []);
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
  return getStorage<Pet[]>(STORAGE_KEYS.PETS, []);
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

// ============ SERVICES API (Real API) ============
export async function getGroomServices(): Promise<GroomService[]> {
  return apiCall<GroomService[]>('/grooming/services');
}

export async function getGroomServiceById(id: string): Promise<GroomService | undefined> {
  try {
    return await apiCall<GroomService>(`/grooming/services/${id}`);
  } catch {
    return undefined;
  }
}

export async function createGroomService(data: Omit<GroomService, 'id' | 'createdAt' | 'updatedAt'>): Promise<GroomService> {
  return apiCall<GroomService>('/grooming/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGroomService(id: string, data: Partial<Omit<GroomService, 'id' | 'createdAt' | 'updatedAt'>>): Promise<GroomService> {
  return apiCall<GroomService>(`/grooming/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteGroomService(id: string): Promise<GroomService> {
  return apiCall<GroomService>(`/grooming/services/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateGroomService(id: string): Promise<GroomService | undefined> {
  const service = await getGroomServiceById(id);
  if (!service) return undefined;
  const duplicated = await createGroomService({
    ...service,
    name: `${service.name} (Cópia)`,
  });
  return duplicated;
}

// ============ PROFESSIONALS API (Real API) ============
export async function getProfessionals(): Promise<Professional[]> {
  return apiCall<Professional[]>('/grooming/professionals');
}

export async function getProfessionalById(id: string): Promise<Professional | undefined> {
  try {
    return await apiCall<Professional>(`/grooming/professionals/${id}`);
  } catch {
    return undefined;
  }
}

export async function createProfessional(data: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>): Promise<Professional> {
  return apiCall<Professional>('/grooming/professionals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProfessional(id: string, data: Partial<Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Professional> {
  return apiCall<Professional>(`/grooming/professionals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProfessional(id: string): Promise<Professional> {
  return apiCall<Professional>(`/grooming/professionals/${id}`, {
    method: 'DELETE',
  });
}

// ============ RESOURCES API (Local for now - could be moved to API) ============
export function getGroomResources(): GroomResource[] {
  return getStorage<GroomResource[]>('grooming_resources', [
    { id: uuid(), tipo: 'BOX', nome: 'Box 1', capacidadeSimultanea: 1, ativo: true },
    { id: uuid(), tipo: 'BOX', nome: 'Box 2', capacidadeSimultanea: 1, ativo: true },
    { id: uuid(), tipo: 'MESA', nome: 'Mesa 1', capacidadeSimultanea: 1, ativo: true },
    { id: uuid(), tipo: 'SECADOR', nome: 'Secador 1', capacidadeSimultanea: 2, ativo: true },
  ]);
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

// ============ TICKETS API (Real API) ============
export async function getGroomTickets(): Promise<GroomTicket[]> {
  return apiCall<GroomTicket[]>('/grooming/tickets');
}

export async function getGroomTicketById(id: string): Promise<GroomTicket | undefined> {
  try {
    return await apiCall<GroomTicket>(`/grooming/tickets/${id}`);
  } catch {
    return undefined;
  }
}

export async function createGroomTicket(data: Omit<GroomTicket, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<GroomTicket> {
  return apiCall<GroomTicket>('/grooming/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGroomTicket(id: string, data: Partial<Omit<GroomTicket, 'id' | 'code' | 'createdAt' | 'updatedAt'>>): Promise<GroomTicket> {
  return apiCall<GroomTicket>(`/grooming/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteGroomTicket(id: string): Promise<GroomTicket> {
  return apiCall<GroomTicket>(`/grooming/tickets/${id}`, {
    method: 'DELETE',
  });
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

// Initialize on load
initGroomingMockData();
