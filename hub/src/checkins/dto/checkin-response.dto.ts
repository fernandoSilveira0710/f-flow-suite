export class CheckInResponseDto {
  id!: string;
  tenantId!: string;
  petId!: string;
  professionalId!: string;
  checkInAt!: Date;
  checkOutAt?: Date | null;
  notes?: string | null;

  // Relations
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
  };
  professional?: {
    id: string;
    name: string;
    role: string;
  };
}