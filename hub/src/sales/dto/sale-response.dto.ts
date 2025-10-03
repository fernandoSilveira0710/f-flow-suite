export interface SaleItemResponseDto {
  id: string;
  productId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export interface SaleResponseDto {
  id: string;
  code: string;
  operator: string;
  paymentMethod: string;
  status: string;
  total: number;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  items: SaleItemResponseDto[];
}