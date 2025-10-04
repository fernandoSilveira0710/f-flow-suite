export class ProfessionalResponseDto {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  specialty?: string;
  services?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}