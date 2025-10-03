export class SaleItemResponseDto {
  id: string;
  productId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export class SaleResponseDto {
  id: string;
  code: string;
  operator: string;
  payment: string;
  status: string;
  total: number;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  items: SaleItemResponseDto[];
}