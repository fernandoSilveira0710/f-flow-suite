import { IsString, IsDateString, IsOptional, IsDecimal, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export class CreateAppointmentDto {
  @IsUUID()
  petId!: string;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  serviceId!: string;

  @IsUUID()
  professionalId!: string;

  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @IsDateString()
  date!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus = AppointmentStatus.SCHEDULED;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  price?: number;
}