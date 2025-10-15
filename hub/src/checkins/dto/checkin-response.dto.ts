export class CheckInResponseDto {
  id: string;
  tenantId: string;
  petId: string;
  professionalId: string;
  checkInAt: Date;
  checkOutAt?: Date;
  notes?: string;

  // Relations
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string;
  };
  professional?: {
    id: string;
    name: string;
    role: string;
  };
}