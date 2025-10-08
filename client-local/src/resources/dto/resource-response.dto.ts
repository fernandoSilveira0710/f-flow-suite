export class ResourceResponseDto {
  id: string;
  name: string;
  type: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}