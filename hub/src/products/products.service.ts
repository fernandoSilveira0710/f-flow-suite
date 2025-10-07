import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProductResponseDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string): Promise<ProductResponseDto[]> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    const products = await this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return products.map(this.mapToResponseDto);
  }

  async findOneByTenant(tenantId: string, productId: string): Promise<ProductResponseDto> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;

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
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;

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
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;

    await this.prisma.product.delete({
      where: { 
        id: productId,
        tenantId 
      },
    });
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