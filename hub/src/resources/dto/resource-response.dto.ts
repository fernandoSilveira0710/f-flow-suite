export class ResourceResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  type!: string;
  description?: string | null;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}