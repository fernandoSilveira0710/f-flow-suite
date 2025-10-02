import { Injectable } from '@nestjs/common';

export interface SaleItemDto {
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface CreateSaleDto {
  code: string;
  operator: string;
  items: SaleItemDto[];
  payment: string;
}

@Injectable()
export class SalesService {
  async createSale(dto: CreateSaleDto) {
    const total = dto.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    return {
      id: 'temp-id',
      ...dto,
      total,
    };
  }
}
