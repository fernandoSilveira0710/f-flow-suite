export class ProductResponseDto {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  salePrice: number;
  costPrice?: number;
  category?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  currentStock: number;
  trackStock: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}