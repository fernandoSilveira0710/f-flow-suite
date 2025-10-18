import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, ValidationPipe } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto, PaymentMethodResponseDto, UpdatePaymentMethodDto } from './dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('tenants/:tenantId/payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('tenantId') tenantId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.service.create(tenantId, dto);
  }

  @Get()
  async findAll(@Param('tenantId') tenantId: string): Promise<PaymentMethodResponseDto[]> {
    return this.service.findAll(tenantId);
  }

  @Get('active')
  async findActive(@Param('tenantId') tenantId: string): Promise<PaymentMethodResponseDto[]> {
    return this.service.findActive(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<PaymentMethodResponseDto> {
    return this.service.findOne(tenantId, id);
  }

  @Patch(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.service.remove(tenantId, id);
  }

  @Put('reorder')
  async reorder(
    @Param('tenantId') tenantId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) body: ReorderDto,
  ): Promise<void> {
    return this.service.reorder(tenantId, body.ids);
  }
}