import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';

@Controller('sales')
export class SalesController {
  private readonly logger = new Logger(SalesController.name);

  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createSaleDto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    this.logger.log('POST /sales - Creating new sale');
    return this.salesService.createSale(createSaleDto);
  }

  @Get()
  async findAll(): Promise<SaleResponseDto[]> {
    this.logger.log('GET /sales - Fetching all sales');
    return this.salesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SaleResponseDto> {
    this.logger.log(`GET /sales/${id} - Fetching sale by ID`);
    return this.salesService.findOne(id);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async refund(@Param('id') id: string): Promise<SaleResponseDto> {
    this.logger.log(`POST /sales/${id}/refund - Refunding sale`);
    return this.salesService.refundSale(id);
  }
}
