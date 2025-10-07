export class CustomerResponseDto {
  id: string;
  tenantId: string;
  name: string;
  documento?: string;
  email?: string;
  phone?: string;
  dataNascISO?: string;
  tags?: string;
  notes?: string;
  address?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  pets?: PetSummaryDto[];
}

export class PetSummaryDto {
  id: string;
  name: string;
  species: string;
  breed?: string;
  active: boolean;
}