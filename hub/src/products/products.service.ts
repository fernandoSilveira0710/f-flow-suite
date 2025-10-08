import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { ProductResponseDto, CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService
  ) {}

  async findAllByTenant(tenantId: string): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return products.map(this.mapToResponseDto);
  }

  async findOneByTenant(tenantId: string, productId: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { 
        id: productId,
        tenantId 
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.mapToResponseDto(product);
  }

  async upsertFromEvent(tenantId: string, eventPayload: any): Promise<ProductResponseDto> {
    const product = await this.prisma.product.upsert({
      where: { 
        id: eventPayload.id,
      },
      create: {
        id: eventPayload.id,
        tenantId,
        name: eventPayload.name,
        description: eventPayload.description,
        sku: eventPayload.sku,
        barcode: eventPayload.barcode,
        salePrice: eventPayload.salePrice,
        costPrice: eventPayload.costPrice,
        category: eventPayload.category,
        unit: eventPayload.unit,
        minStock: eventPayload.minStock,
        maxStock: eventPayload.maxStock,
        stockQty: eventPayload.stockQty || eventPayload.currentStock || 0,
        trackStock: eventPayload.trackStock,
        active: eventPayload.active,
        createdAt: eventPayload.createdAt,
        updatedAt: eventPayload.updatedAt,
      },
      update: {
        name: eventPayload.name,
        description: eventPayload.description,
        sku: eventPayload.sku,
        barcode: eventPayload.barcode,
        salePrice: eventPayload.salePrice,
        costPrice: eventPayload.costPrice,
        category: eventPayload.category,
        unit: eventPayload.unit,
        minStock: eventPayload.minStock,
        maxStock: eventPayload.maxStock,
        stockQty: eventPayload.stockQty || eventPayload.currentStock || 0,
        trackStock: eventPayload.trackStock,
        active: eventPayload.active,
        updatedAt: eventPayload.updatedAt,
      },
    });

    return this.mapToResponseDto(product);
  }

  async deleteFromEvent(tenantId: string, productId: string): Promise<void> {
    await this.prisma.product.delete({
      where: { 
        id: productId,
        tenantId 
      },
    });
  }

  async create(tenantId: string, createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Check if product with same SKU already exists
    if (createProductDto.sku) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          tenantId,
          sku: createProductDto.sku,
        },
      });

      if (existingProduct) {
        throw new ConflictException(`Product with SKU ${createProductDto.sku} already exists`);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: createProductDto.name,
        description: createProductDto.description,
        sku: createProductDto.sku,
        barcode: createProductDto.barcode,
        salePrice: createProductDto.salePrice,
        costPrice: createProductDto.costPrice,
        category: createProductDto.category,
        unit: createProductDto.unit,
        minStock: createProductDto.minStock,
        maxStock: createProductDto.maxStock,
        stockQty: createProductDto.stockQty || 0,
        trackStock: createProductDto.trackStock ?? true,
        active: createProductDto.active ?? true,
      },
    });

    // Generate sync event
    await this.generateProductEvent('product.created.v1', product);

    return this.mapToResponseDto(product);
  }

  async update(tenantId: string, id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    // Check if product exists
    const existingProduct = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if SKU is being changed and if it conflicts with another product
    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const conflictingProduct = await this.prisma.product.findFirst({
        where: {
          tenantId,
          sku: updateProductDto.sku,
          id: { not: id },
        },
      });

      if (conflictingProduct) {
        throw new ConflictException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
    }

    const product = await this.prisma.product.update({
      where: { id, tenantId },
      data: {
        ...(updateProductDto.name && { name: updateProductDto.name }),
        ...(updateProductDto.description !== undefined && { description: updateProductDto.description }),
        ...(updateProductDto.sku !== undefined && { sku: updateProductDto.sku }),
        ...(updateProductDto.barcode !== undefined && { barcode: updateProductDto.barcode }),
        ...(updateProductDto.salePrice !== undefined && { salePrice: updateProductDto.salePrice }),
        ...(updateProductDto.costPrice !== undefined && { costPrice: updateProductDto.costPrice }),
        ...(updateProductDto.category !== undefined && { category: updateProductDto.category }),
        ...(updateProductDto.unit !== undefined && { unit: updateProductDto.unit }),
        ...(updateProductDto.minStock !== undefined && { minStock: updateProductDto.minStock }),
        ...(updateProductDto.maxStock !== undefined && { maxStock: updateProductDto.maxStock }),
        ...(updateProductDto.stockQty !== undefined && { stockQty: updateProductDto.stockQty }),
        ...(updateProductDto.trackStock !== undefined && { trackStock: updateProductDto.trackStock }),
        ...(updateProductDto.active !== undefined && { active: updateProductDto.active }),
      },
    });

    // Generate sync event
    await this.generateProductEvent('product.updated.v1', product);

    return this.mapToResponseDto(product);
  }

  async remove(tenantId: string, id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete by setting active to false
    const updatedProduct = await this.prisma.product.update({
      where: { id, tenantId },
      data: { active: false },
    });

    // Generate sync event
    await this.generateProductEvent('product.deleted.v1', updatedProduct);

    return this.mapToResponseDto(updatedProduct);
  }

  private async generateProductEvent(eventType: string, product: any): Promise<void> {
    const payload = {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      category: product.category,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      stockQty: product.stockQty,
      trackStock: product.trackStock,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    await this.eventsService.createEvent(eventType, payload);
  }

  private mapToResponseDto(product: any): ProductResponseDto {
    return {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      category: product.category,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      stockQty: product.stockQty,
      trackStock: product.trackStock,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}