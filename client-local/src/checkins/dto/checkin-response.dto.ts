export class CheckInResponseDto {
  id: string;
  petId: string;
  professionalId: string;
  checkInAt: Date;
  checkOutAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

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
    role?: string;
  };
}