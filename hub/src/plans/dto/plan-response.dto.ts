export class PlanResponseDto {
  id!: string;
  name!: string;
  description?: string | null;
  price!: number;
  currency!: string;
  maxSeats!: number;
  maxDevices!: number;
  featuresEnabled!: Record<string, any> | string;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}