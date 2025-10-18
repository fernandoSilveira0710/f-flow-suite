export class PetResponseDto {
  id!: string;
  tenantId!: string;
  tutorId!: string;
  name!: string;
  species!: string;
  breed?: string | null;
  weight?: number | null;
  birthDate?: Date | null;
  observations?: string | null;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  tutor?: CustomerSummaryDto;
}

export class CustomerSummaryDto {
  id!: string;
  name!: string;
  email?: string | null;
  phone?: string | null;
}