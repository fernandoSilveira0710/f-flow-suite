import { Body, Controller, Post } from '@nestjs/common';
import { SalesService, CreateSaleDto } from './sales.service.js';

@Controller('pos/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }
}
