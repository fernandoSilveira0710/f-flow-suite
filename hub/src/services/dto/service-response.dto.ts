export interface ServiceResponseDto {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}