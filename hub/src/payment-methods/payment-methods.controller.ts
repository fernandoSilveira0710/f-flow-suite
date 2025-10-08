import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto';
import { TenantId } from '../common/tenant-id.decorator';
import { LicenseGuard } from '../licenses/license.guard';

@Controller('tenants/:tenantId/payment-methods')
@UseGuards(LicenseGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.create(tenantId, createPaymentMethodDto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.paymentMethodsService.findAll(tenantId);
  }

  @Get('active')
  findActivePaymentMethods(@TenantId() tenantId: string) {
    return this.paymentMethodsService.findActivePaymentMethods(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.paymentMethodsService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(tenantId, id, updatePaymentMethodDto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.paymentMethodsService.remove(tenantId, id);
  }

  @Put('reorder')
  reorder(
    @TenantId() tenantId: string,
    @Body() body: { ids: string[] },
  ) {
    return this.paymentMethodsService.reorder(tenantId, body.ids);
  }
}