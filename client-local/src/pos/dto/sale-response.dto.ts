export class SaleItemResponseDto {
  id: string;
  productId: string;
  productName?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export class SaleResponseDto {
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