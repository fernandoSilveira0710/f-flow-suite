export class PlanResponseDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  maxSeats: number;
  maxDevices: number;
  featuresEnabled: Record<string, any>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}