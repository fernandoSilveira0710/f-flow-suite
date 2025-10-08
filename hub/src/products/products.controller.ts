import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { ProductsService } from './products.service';
import { ProductResponseDto, CreateProductDto, UpdateProductDto } from './dto';

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

  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(tenantId, createProductDto);
  }

  @Put(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(tenantId, id, updateProductDto);
  }

  @Delete(':id')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.remove(tenantId, id);
  }
}