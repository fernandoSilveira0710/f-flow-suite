export class CustomerResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  documento?: string | null;
  email?: string | null;
  phone?: string | null;
  dataNascISO?: string | null;
  tags?: string | null;
  notes?: string | null;
  address?: string | null;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  pets?: PetSummaryDto[];
}

export class PetSummaryDto {
  id!: string;
  name!: string;
  species!: string;
  breed?: string | null;
  active!: boolean;
}