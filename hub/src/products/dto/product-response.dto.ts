export interface ProductResponseDto {
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
  stockQty: number; // Changed from currentStock to stockQty to match Prisma schema
  trackStock: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}