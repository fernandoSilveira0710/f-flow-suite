import { IsString, IsUUID } from 'class-validator';

export class ResourceDeletedEventDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  tenantId!: string;
}