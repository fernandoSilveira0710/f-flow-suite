// ============================================
// GROOMING API - Mock com localStorage
// ============================================

// ============ TYPES ============

export interface Tutor {
  id: string;
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
  nome: string;
  categoria: ServiceCategory;
  precoPorPorte: {
    PP: number;
    P: number;
    M: number;
    G: number;
    GG: number;
  };
  usaEstoque?: Array<{ sku: string; qtd: number; unidade: 'ml' | 'un' }>;
  duracaoBaseMin: number;
  requerRecurso?: 'BOX' | 'MESA' | 'SECADOR' | null;
  cor?: string;
  ativo: boolean;
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
  codigo: string;
  dataAberturaISO: string;
  origem: TicketOrigem;
  tutorId: string;
  tutorNome: string;
  petId: string;
  petNome: string;
  itens: Array<{
    serviceId: string;
    nome: string;
    porte: Porte;
    preco: number;
    qtd: number;
  }>;
  status: TicketStatus;
  alocacoes?: Array<{ resourceId: string; fromISO: string; toISO: string }>;
  observacoes?: string;
  fotosAntes?: string[];
  fotosDepois?: string[];
  incidentes?: Array<{ dataISO: string; tipo: IncidentType; desc: string }>;
  avaliacao?: { nota: number; comentario?: string };
  sinalRecebido?: number;
  vendaId?: string;
  createdBy?: string;
  updatedBy?: string;
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

// ============ STORAGE KEYS ============
const STORAGE_KEYS = {
  TUTORS: 'grooming_tutors',
  PETS: 'grooming_pets',
  SERVICES: 'grooming_services',
  RESOURCES: 'grooming_resources',
  TICKETS: 'grooming_tickets',
  PREFS: 'grooming_prefs',
  COUNTER: 'grooming_ticket_counter',
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

// ============ INIT MOCK DATA ============
export function initGroomingMockData(): void {
  // Init Services
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    const mockServices: GroomService[] = [
      {
        id: uuid(),
        nome: 'Banho Completo',
        categoria: 'BANHO',
        precoPorPorte: { PP: 40, P: 50, M: 60, G: 80, GG: 100 },
        duracaoBaseMin: 60,
        requerRecurso: 'BOX',
        cor: '#3B82F6',
        ativo: true,
      },
      {
        id: uuid(),
        nome: 'Tosa Higiênica',
        categoria: 'HIGIENE',
        precoPorPorte: { PP: 30, P: 35, M: 40, G: 50, GG: 60 },
        duracaoBaseMin: 30,
        requerRecurso: 'MESA',
        cor: '#10B981',
        ativo: true,
      },
      {
        id: uuid(),
        nome: 'Tosa Completa',
        categoria: 'TOSA',
        precoPorPorte: { PP: 60, P: 70, M: 90, G: 120, GG: 150 },
        duracaoBaseMin: 90,
        requerRecurso: 'MESA',
        cor: '#F59E0B',
        ativo: true,
      },
    ];
    setStorage(STORAGE_KEYS.SERVICES, mockServices);
  }

  // Init Resources
  if (!localStorage.getItem(STORAGE_KEYS.RESOURCES)) {
    const mockResources: GroomResource[] = [
      { id: uuid(), tipo: 'BOX', nome: 'Box 1', capacidadeSimultanea: 1, ativo: true },
      { id: uuid(), tipo: 'BOX', nome: 'Box 2', capacidadeSimultanea: 1, ativo: true },
      { id: uuid(), tipo: 'MESA', nome: 'Mesa 1', capacidadeSimultanea: 1, ativo: true },
      { id: uuid(), tipo: 'SECADOR', nome: 'Secador 1', capacidadeSimultanea: 2, ativo: true },
    ];
    setStorage(STORAGE_KEYS.RESOURCES, mockResources);
  }

  // Init Prefs
  if (!localStorage.getItem(STORAGE_KEYS.PREFS)) {
    const defaultPrefs: GroomPrefs = {
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
    setStorage(STORAGE_KEYS.PREFS, defaultPrefs);
  }

  // Init Counter
  if (!localStorage.getItem(STORAGE_KEYS.COUNTER)) {
    setStorage(STORAGE_KEYS.COUNTER, 1);
  }
}

// Initialize on load
initGroomingMockData();

// ============ TUTORS API ============
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

// ============ PETS API ============
export function getPets(): Pet[] {
  return getStorage<Pet[]>(STORAGE_KEYS.PETS, []);
}

export function getPetById(id: string): Pet | undefined {
  return getPets().find((p) => p.id === id);
}

export function getPetsByTutor(tutorId: string): Pet[] {
  return getPets().filter((p) => p.tutorId === tutorId);
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
  return getStorage<GroomService[]>(STORAGE_KEYS.SERVICES, []);
}

export function getGroomServiceById(id: string): GroomService | undefined {
  return getGroomServices().find((s) => s.id === id);
}

export function createGroomService(data: Omit<GroomService, 'id'>): GroomService {
  const service: GroomService = { id: uuid(), ...data };
  const services = getGroomServices();
  services.push(service);
  setStorage(STORAGE_KEYS.SERVICES, services);
  return service;
}

export function updateGroomService(id: string, data: Partial<Omit<GroomService, 'id'>>): void {
  const services = getGroomServices();
  const index = services.findIndex((s) => s.id === id);
  if (index !== -1) {
    services[index] = { ...services[index], ...data };
    setStorage(STORAGE_KEYS.SERVICES, services);
  }
}

export function deleteGroomService(id: string): void {
  const services = getGroomServices().filter((s) => s.id !== id);
  setStorage(STORAGE_KEYS.SERVICES, services);
}

export function duplicateGroomService(id: string): GroomService | undefined {
  const service = getGroomServiceById(id);
  if (!service) return undefined;
  const duplicated = createGroomService({
    ...service,
    nome: `${service.nome} (Cópia)`,
  });
  return duplicated;
}

// ============ RESOURCES API ============
export function getGroomResources(): GroomResource[] {
  return getStorage<GroomResource[]>(STORAGE_KEYS.RESOURCES, []);
}

export function getGroomResourceById(id: string): GroomResource | undefined {
  return getGroomResources().find((r) => r.id === id);
}

export function createGroomResource(data: Omit<GroomResource, 'id'>): GroomResource {
  const resource: GroomResource = { id: uuid(), ...data };
  const resources = getGroomResources();
  resources.push(resource);
  setStorage(STORAGE_KEYS.RESOURCES, resources);
  return resource;
}

export function updateGroomResource(id: string, data: Partial<Omit<GroomResource, 'id'>>): void {
  const resources = getGroomResources();
  const index = resources.findIndex((r) => r.id === id);
  if (index !== -1) {
    resources[index] = { ...resources[index], ...data };
    setStorage(STORAGE_KEYS.RESOURCES, resources);
  }
}

export function deleteGroomResource(id: string): void {
  const resources = getGroomResources().filter((r) => r.id !== id);
  setStorage(STORAGE_KEYS.RESOURCES, resources);
}

// ============ TICKETS API ============
export function getGroomTickets(): GroomTicket[] {
  return getStorage<GroomTicket[]>(STORAGE_KEYS.TICKETS, []);
}

export function getGroomTicketById(id: string): GroomTicket | undefined {
  return getGroomTickets().find((t) => t.id === id);
}

function getNextTicketCode(): string {
  const counter = getStorage<number>(STORAGE_KEYS.COUNTER, 1);
  const year = new Date().getFullYear();
  const code = `BTH-${year}-${String(counter).padStart(6, '0')}`;
  setStorage(STORAGE_KEYS.COUNTER, counter + 1);
  return code;
}

export function createGroomTicket(data: Omit<GroomTicket, 'id' | 'codigo'>): GroomTicket {
  const ticket: GroomTicket = {
    id: uuid(),
    codigo: getNextTicketCode(),
    ...data,
  };
  const tickets = getGroomTickets();
  tickets.push(ticket);
  setStorage(STORAGE_KEYS.TICKETS, tickets);
  return ticket;
}

export function updateGroomTicket(id: string, data: Partial<Omit<GroomTicket, 'id' | 'codigo'>>): void {
  const tickets = getGroomTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index !== -1) {
    tickets[index] = { ...tickets[index], ...data };
    setStorage(STORAGE_KEYS.TICKETS, tickets);
  }
}

export function deleteGroomTicket(id: string): void {
  const tickets = getGroomTickets().filter((t) => t.id !== id);
  setStorage(STORAGE_KEYS.TICKETS, tickets);
}

// ============ PREFS API ============
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
