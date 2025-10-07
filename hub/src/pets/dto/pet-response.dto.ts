export class PetResponseDto {
  id: string;
  tenantId: string;
  tutorId: string;
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  birthDate?: string;
  observations?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  tutor?: CustomerSummaryDto;
}

export class CustomerSummaryDto {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}