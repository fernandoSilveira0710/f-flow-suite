import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto';

@Controller('tenants/:tenantId/products')
@UseGuards(OidcGuard, LicenseGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Param('tenantId') tenantId: string): Promise<ProductResponseDto[]> {
    return this.productsService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOneByTenant(tenantId, id);
  }
}