import { v4 as uuid } from 'uuid';

// DTOs
export interface CreateProfessionalDto {
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  description?: string;
  serviceIds?: string[];
  active?: boolean;
}

export interface UpdateProfessionalDto {
  name?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  description?: string;
  serviceIds?: string[];
  active?: boolean;
}

export interface ProfessionalResponseDto {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  description?: string;
  services?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Storage keys
const STORAGE_KEYS = {
  PROFESSIONALS: 'professionals',
} as const;

// Utility functions
function getFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return null;
  }
}

function setInStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

// Initialize mock data if not exists
function initMockData(): void {
  const existingProfessionals = getFromStorage<ProfessionalResponseDto[]>(STORAGE_KEYS.PROFESSIONALS);
  
  if (!existingProfessionals) {
    const mockProfessionals: ProfessionalResponseDto[] = [
      {
        id: uuid(),
        name: 'Dr. João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-1111',
        specialty: 'Veterinário',
        description: 'Especialista em pequenos animais',
        services: [],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuid(),
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(11) 99999-2222',
        specialty: 'Tosadora',
        description: 'Especialista em tosa e banho',
        services: [],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    setInStorage(STORAGE_KEYS.PROFESSIONALS, mockProfessionals);
  }
}

// Initialize mock data on module load
initMockData();

// API functions
export function getProfessionals(): ProfessionalResponseDto[] {
  try {
    const professionals = getFromStorage<ProfessionalResponseDto[]>(STORAGE_KEYS.PROFESSIONALS);
    return professionals || [];
  } catch (error) {
    console.error('Error getting professionals:', error);
    return [];
  }
}

export function getProfessionalById(id: string): ProfessionalResponseDto | null {
  try {
    const professionals = getProfessionals();
    return professionals.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error getting professional by ID:', error);
    return null;
  }
}

export function createProfessional(data: CreateProfessionalDto): ProfessionalResponseDto {
  try {
    const professionals = getProfessionals();
    const newProfessional: ProfessionalResponseDto = {
      id: uuid(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      specialty: data.specialty,
      description: data.description,
      services: data.serviceIds || [],
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    professionals.push(newProfessional);
    setInStorage(STORAGE_KEYS.PROFESSIONALS, professionals);
    
    return newProfessional;
  } catch (error) {
    console.error('Error creating professional:', error);
    throw new Error('Failed to create professional');
  }
}

export function updateProfessional(id: string, data: UpdateProfessionalDto): ProfessionalResponseDto | null {
  try {
    const professionals = getProfessionals();
    const index = professionals.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }
    
    professionals[index] = {
      ...professionals[index],
      ...data,
      services: data.serviceIds !== undefined ? data.serviceIds : professionals[index].services,
      updatedAt: new Date().toISOString(),
    };
    
    setInStorage(STORAGE_KEYS.PROFESSIONALS, professionals);
    
    return professionals[index];
  } catch (error) {
    console.error('Error updating professional:', error);
    return null;
  }
}

export function deleteProfessional(id: string): boolean {
  try {
    const professionals = getProfessionals();
    const filteredProfessionals = professionals.filter(p => p.id !== id);
    
    if (filteredProfessionals.length === professionals.length) {
      return false; // Professional not found
    }
    
    setInStorage(STORAGE_KEYS.PROFESSIONALS, filteredProfessionals);
    return true;
  } catch (error) {
    console.error('Error deleting professional:', error);
    return false;
  }
}

// Search and filter functions
export function searchProfessionals(query: string): ProfessionalResponseDto[] {
  try {
    const professionals = getProfessionals();
    const lowerQuery = query.toLowerCase();
    
    return professionals.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.email?.toLowerCase().includes(lowerQuery) ||
      p.specialty?.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching professionals:', error);
    return [];
  }
}

export function getActiveProfessionals(): ProfessionalResponseDto[] {
  try {
    const professionals = getProfessionals();
    return professionals.filter(p => p.active);
  } catch (error) {
    console.error('Error getting active professionals:', error);
    return [];
  }
}

export function getProfessionalsByService(serviceId: string): ProfessionalResponseDto[] {
  try {
    const professionals = getProfessionals();
    return professionals.filter(p => 
      p.active && p.services && p.services.includes(serviceId)
    );
  } catch (error) {
    console.error('Error getting professionals by service:', error);
    return [];
  }
}