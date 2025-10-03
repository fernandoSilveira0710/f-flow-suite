export class ProductResponseDto {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost?: number;
  category?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  trackStock: boolean;
  active: boolean;
  currentStock: number;
  createdAt: Date;
  updatedAt: Date;
}