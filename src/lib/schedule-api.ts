/**
 * Schedule (Agenda) Mock API
 * Persistência via localStorage
 */
import { API_URLS } from './env';

// Types
export interface Customer {
  id: string;
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  dataNascISO?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  tags?: string[];
  notas?: string;
  pets?: Array<{
    id: string;
    nome: string;
    especie?: string;
    raca?: string;
    observacoes?: string;
  }>;
  ativo: boolean;
  isTutor?: boolean; // Flag para indicar se é tutor de pet
  createdAtISO: string;
}

export interface Service {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  duracaoMin: number;
  precoBase: number;
  bufferAntesMin?: number;
  bufferDepoisMin?: number;
  exigeRecursoUnico?: boolean;
  usaEstoque?: Array<{ sku: string; qtd: number }>;
  cor?: string;
  staffHabilitadoIds?: string[];
  ativo: boolean;
  createdAtISO: string;
}

export type StaffType = 'PROFISSIONAL' | 'RECURSO';

export interface Staff {
  id: string;
  nome: string;
  tipo: StaffType;
  funcoes?: string[]; // serviceIds que atende
  cores?: { agenda?: string };
  jornadaPadrao?: Array<{
    weekday: number; // 0-6
    start: string;   // HH:mm
    end: string;
  }>;
  intervalosFixos?: Array<{
    weekday: number;
    start: string;
    end: string;
  }>;
  folgas?: Array<{
    dateISO: string;
    motivo?: string;
  }>;
  capacidadeSimultanea?: number;
  ativo: boolean;
}

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerContact?: string;
  petId?: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePrefs {
  intervaloGradeMin: 15 | 30;
  politicaCancelamento?: {
    horasAntecedencia: number;
    cobrarPercent?: number;
  };
  permitirOverbooking?: boolean;
  confirmarAuto?: boolean;
  notificacoes?: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    lembreteMinAntes?: number;
  };
  abertura?: string;
  fechamento?: string;
  timezone?: string;
}

// Storage keys
const KEYS = {
  SERVICES: '2f.schedule.services',
  STAFF: '2f.schedule.staff',
  CUSTOMERS: '2f.schedule.customers',
  APPOINTMENTS: '2f.schedule.appointments',
  PREFS: '2f.schedule.prefs',
  NOTIFICATIONS: '2f.schedule.notifications',
};

// Helpers
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// API Helper
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = API_URLS.CLIENT_LOCAL;
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize mock data
function initMockData() {
  const services = getStorage<Service[]>(KEYS.SERVICES, []);
  if (services.length === 0) {
    const mockServices: Service[] = [
      {
        id: uuid(),
        nome: 'Banho & Tosa Completo',
        descricao: 'Banho, tosa higiênica, corte de unhas e limpeza de ouvidos',
        categoria: 'Higiene',
        duracaoMin: 90,
        precoBase: 80.0,
        bufferAntesMin: 15,
        bufferDepoisMin: 15,
        cor: '#3B82F6',
        ativo: true,
        createdAtISO: new Date().toISOString(),
      },
      {
        id: uuid(),
        nome: 'Banho Simples',
        categoria: 'Higiene',
        duracaoMin: 45,
        precoBase: 40.0,
        bufferDepoisMin: 10,
        cor: '#22C55E',
        ativo: true,
        createdAtISO: new Date().toISOString(),
      },
      {
        id: uuid(),
        nome: 'Tosa Higiênica',
        categoria: 'Tosa',
        duracaoMin: 30,
        precoBase: 35.0,
        cor: '#F59E0B',
        ativo: true,
        createdAtISO: new Date().toISOString(),
      },
    ];
    setStorage(KEYS.SERVICES, mockServices);
  }

  // Initialize customers
  const customers = getStorage<Customer[]>(KEYS.CUSTOMERS, []);
  if (customers.length === 0) {
    const mockCustomers: Customer[] = [
      {
        id: uuid(),
        nome: 'Maria Silva',
        documento: '123.456.789-00',
        email: 'maria@email.com',
        telefone: '(11) 99999-1111',
        endereco: {
          rua: 'Rua das Flores, 123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01234-567'
        },
        pets: [{
          id: uuid(),
          nome: 'Rex',
          especie: 'Cachorro',
          raca: 'Golden Retriever',
          observacoes: 'Muito dócil'
        }],
        ativo: true,
        isTutor: true,
        createdAtISO: new Date().toISOString(),
      },
      {
        id: uuid(),
        nome: 'João Santos',
        documento: '987.654.321-00',
        email: 'joao@email.com',
        telefone: '(11) 99999-2222',
        endereco: {
          rua: 'Av. Paulista, 456',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01310-100'
        },
        pets: [{
          id: uuid(),
          nome: 'Mimi',
          especie: 'Gato',
          raca: 'Persa',
          observacoes: 'Precisa de cuidado especial'
        }],
        ativo: true,
        isTutor: true,
        createdAtISO: new Date().toISOString(),
      }
    ];
    setStorage(KEYS.CUSTOMERS, mockCustomers);
  }

  // Initialize staff
  const staff = getStorage<Staff[]>(KEYS.STAFF, []);
  if (staff.length === 0) {
    const mockStaff: Staff[] = [
      {
        id: uuid(),
        nome: 'Dr. João Silva',
        tipo: 'PROFISSIONAL',
        funcoes: [],
        cores: { agenda: '#3B82F6' },
        ativo: true,
      },
      {
        id: uuid(),
        nome: 'Maria Santos',
        tipo: 'PROFISSIONAL',
        funcoes: [],
        cores: { agenda: '#22C55E' },
        ativo: true,
      }
    ];
    setStorage(KEYS.STAFF, mockStaff);
  }

  // Initialize appointments
  const appointments = getStorage<Appointment[]>(KEYS.APPOINTMENTS, []);
  if (appointments.length === 0) {
    const mockCustomers = getStorage<Customer[]>(KEYS.CUSTOMERS, []);
    const mockServices = getStorage<Service[]>(KEYS.SERVICES, []);
    const mockStaff = getStorage<Staff[]>(KEYS.STAFF, []);
    
    if (mockCustomers.length > 0 && mockServices.length > 0 && mockStaff.length > 0) {
      const mockAppointments: Appointment[] = [
        {
          id: '5c3a6801-eb79-4dd3-840c-f0f52b37aff1',
          customerId: mockCustomers[0].id,
          customerName: mockCustomers[0].nome,
          customerContact: mockCustomers[0].telefone,
          petId: mockCustomers[0].pets?.[0]?.id,
          serviceId: mockServices[0].id,
          serviceName: mockServices[0].nome,
          professionalId: mockStaff[0].id,
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas a partir de agora
          endTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 horas a partir de agora
          status: 'SCHEDULED',
          notes: 'Primeiro agendamento de exemplo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuid(),
          customerId: mockCustomers[1].id,
          customerName: mockCustomers[1].nome,
          customerContact: mockCustomers[1].telefone,
          petId: mockCustomers[1].pets?.[0]?.id,
          serviceId: mockServices[1].id,
          serviceName: mockServices[1].nome,
          professionalId: mockStaff[1].id,
          startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas a partir de agora
          endTime: new Date(Date.now() + 4.75 * 60 * 60 * 1000).toISOString(), // 4.75 horas a partir de agora
          status: 'CONFIRMED',
          notes: 'Segundo agendamento de exemplo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      setStorage(KEYS.APPOINTMENTS, mockAppointments);
    }
  }

  const prefs = getStorage<SchedulePrefs | null>(KEYS.PREFS, null);
  if (!prefs) {
    const defaultPrefs: SchedulePrefs = {
      intervaloGradeMin: 30,
      confirmarAuto: true,
      permitirOverbooking: false,
      abertura: '08:00',
      fechamento: '18:00',
      timezone: 'America/Sao_Paulo',
      politicaCancelamento: {
        horasAntecedencia: 24,
        cobrarPercent: 50,
      },
      notificacoes: {
        email: true,
        sms: false,
        whatsapp: false,
        lembreteMinAntes: 60,
      },
    };
    setStorage(KEYS.PREFS, defaultPrefs);
  }
}

initMockData();

// ============= SERVICES API =============

export function getServices(): Service[] {
  const services = getStorage<Service[]>(KEYS.SERVICES, []);
  // Ensure we always return an array
  return Array.isArray(services) ? services : [];
}

export function getServiceById(id: string): Service | null {
  const services = getServices();
  return services.find(s => s.id === id) || null;
}

export function createService(data: Omit<Service, 'id' | 'createdAtISO'>): Service {
  const services = getServices();
  const newService: Service = {
    ...data,
    id: uuid(),
    createdAtISO: new Date().toISOString(),
  };
  services.push(newService);
  setStorage(KEYS.SERVICES, services);
  return newService;
}

export function updateService(id: string, updates: Partial<Service>): Service | null {
  const services = getServices();
  const index = services.findIndex(s => s.id === id);
  if (index === -1) return null;

  services[index] = { ...services[index], ...updates };
  setStorage(KEYS.SERVICES, services);
  return services[index];
}

export function deleteService(id: string): boolean {
  const services = getServices();
  const filtered = services.filter(s => s.id !== id);
  if (filtered.length === services.length) return false;
  setStorage(KEYS.SERVICES, filtered);
  return true;
}

export function duplicateService(id: string): Service | null {
  const original = getServiceById(id);
  if (!original) return null;

  const duplicate = createService({
    ...original,
    nome: `${original.nome} (cópia)`,
  });
  return duplicate;
}

// ============= STAFF API =============

export function getStaff(): Staff[] {
  const staff = getStorage<Staff[]>(KEYS.STAFF, []);
  return Array.isArray(staff) ? staff : [];
}

export function getStaffById(id: string): Staff | null {
  const staff = getStaff();
  return staff.find(s => s.id === id) || null;
}

export function createStaff(data: Omit<Staff, 'id'>): Staff {
  const staff = getStaff();
  const newStaff: Staff = {
    ...data,
    id: uuid(),
  };
  staff.push(newStaff);
  setStorage(KEYS.STAFF, staff);
  return newStaff;
}

export function updateStaff(id: string, updates: Partial<Staff>): Staff | null {
  const staff = getStaff();
  const index = staff.findIndex(s => s.id === id);
  if (index === -1) return null;

  staff[index] = { ...staff[index], ...updates };
  setStorage(KEYS.STAFF, staff);
  return staff[index];
}

export function deleteStaff(id: string): boolean {
  const staff = getStaff();
  const filtered = staff.filter(s => s.id !== id);
  if (filtered.length === staff.length) return false;
  setStorage(KEYS.STAFF, filtered);
  return true;
}

// ============= CUSTOMERS API =============

export function getCustomers(): Customer[] {
  const customers = getStorage<Customer[]>(KEYS.CUSTOMERS, []);
  return Array.isArray(customers) ? customers : [];
}

export function getCustomerById(id: string): Customer | null {
  const customers = getCustomers();
  return customers.find(c => c.id === id) || null;
}

export function createCustomer(data: Omit<Customer, 'id' | 'createdAtISO'>): Customer {
  const customers = getCustomers();
  const newCustomer: Customer = {
    ...data,
    id: uuid(),
    createdAtISO: new Date().toISOString(),
  };
  customers.push(newCustomer);
  setStorage(KEYS.CUSTOMERS, customers);
  return newCustomer;
}

export function updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) return null;

  customers[index] = { ...customers[index], ...updates };
  setStorage(KEYS.CUSTOMERS, customers);
  return customers[index];
}

export function deleteCustomer(id: string): boolean {
  const customers = getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  if (filtered.length === customers.length) return false;
  setStorage(KEYS.CUSTOMERS, filtered);
  return true;
}

// ============= APPOINTMENTS API =============

export async function getAppointments(): Promise<Appointment[]> {
  const appointments = getStorage<Appointment[]>(KEYS.APPOINTMENTS, []);
  return Array.isArray(appointments) ? appointments : [];
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  try {
    const appointments = getStorage<Appointment[]>(KEYS.APPOINTMENTS, []);
    const appointment = appointments.find(a => a.id === id);
    return appointment || null;
  } catch (error) {
    return null;
  }
}

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
  const appointments = getStorage<Appointment[]>(KEYS.APPOINTMENTS, []);
  
  const newAppointment: Appointment = {
    ...data,
    id: uuid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const updatedAppointments = [...appointments, newAppointment];
  setStorage(KEYS.APPOINTMENTS, updatedAppointments);
  
  return newAppointment;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
  try {
    const appointments = getStorage<Appointment[]>(KEYS.APPOINTMENTS, []);
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return null;
    }
    
    const updatedAppointment: Appointment = {
      ...appointments[appointmentIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    appointments[appointmentIndex] = updatedAppointment;
    setStorage(KEYS.APPOINTMENTS, appointments);
    
    return updatedAppointment;
  } catch (error) {
    return null;
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    const appointments = getStorage<Appointment[]>(KEYS.APPOINTMENTS, []);
    const filteredAppointments = appointments.filter(a => a.id !== id);
    
    if (filteredAppointments.length === appointments.length) {
      return false; // Appointment not found
    }
    
    setStorage(KEYS.APPOINTMENTS, filteredAppointments);
    return true;
  } catch (error) {
    return false;
  }
}

// ============= PREFERENCES API =============

export function getSchedulePrefs(): SchedulePrefs {
  return getStorage<SchedulePrefs>(KEYS.PREFS, {
    intervaloGradeMin: 30,
    confirmarAuto: true,
    permitirOverbooking: false,
    abertura: '08:00',
    fechamento: '18:00',
    timezone: 'America/Sao_Paulo',
  });
}

export function saveSchedulePrefs(prefs: SchedulePrefs): void {
  setStorage(KEYS.PREFS, prefs);
}
