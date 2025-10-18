import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          imageUrl: createProductDto.imageUrl,
          sku: createProductDto.sku,
          barcode: createProductDto.barcode,
          salePrice: createProductDto.price,
          costPrice: createProductDto.cost,
          category: createProductDto.category,
          active: createProductDto.active ?? true,
          stockQty: 0,
        },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          sku: true,
          barcode: true,
          salePrice: true,
          costPrice: true,
          category: true,
          stockQty: true,
          marginPct: true,
          expiryDate: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate outbox event for synchronization
      await this.generateProductEvent(product, 'product.upserted.v1');

      return this.mapToResponseDto(product);
    } catch (error: any) {
      // Handle Prisma unique constraint errors gracefully
      if (error?.code === 'P2002') {
        const fields = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : String(error?.meta?.target ?? 'unique field');
        this.logger.warn(`Unique constraint violation on product create: ${fields}`);
        throw new ConflictException(`Já existe um produto com valor duplicado em: ${fields}`);
      }
      this.logger.error('Unexpected error creating product', error);
      throw error;
    }
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        sku: true,
        barcode: true,
        salePrice: true,
        costPrice: true,
        category: true,
        stockQty: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        marginPct: true,
        expiryDate: true,
        minStock: true,
        // intentionally omit fields that may not exist in older DBs
        // unit: true,
        // maxStock: true,
        // trackStock: true,
      },
    });

    return products.map(product => this.mapToResponseDto(product));
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        sku: true,
        barcode: true,
        salePrice: true,
        costPrice: true,
        category: true,
        stockQty: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        marginPct: true,
        expiryDate: true,
        unit: true,
        minStock: true,
        maxStock: true,
        trackStock: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.mapToResponseDto(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    let product;
    try {
      product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(updateProductDto.name && { name: updateProductDto.name }),
          ...(updateProductDto.description !== undefined && { description: updateProductDto.description }),
          ...(updateProductDto.imageUrl !== undefined && { imageUrl: updateProductDto.imageUrl }),
          ...(updateProductDto.sku !== undefined && { sku: updateProductDto.sku }),
          ...(updateProductDto.barcode !== undefined && { barcode: updateProductDto.barcode }),
          ...(updateProductDto.price !== undefined && { salePrice: updateProductDto.price }),
          ...(updateProductDto.cost !== undefined && { costPrice: updateProductDto.cost }),
          ...(updateProductDto.marginPct !== undefined && { marginPct: updateProductDto.marginPct }),
          ...(updateProductDto.expiryDate !== undefined && { expiryDate: new Date(updateProductDto.expiryDate) }),
          ...(updateProductDto.category !== undefined && { category: updateProductDto.category }),
          ...(updateProductDto.unit !== undefined && { unit: updateProductDto.unit }),
          ...(updateProductDto.minStock !== undefined && { minStock: updateProductDto.minStock }),
          ...(updateProductDto.maxStock !== undefined && { maxStock: updateProductDto.maxStock }),
          ...(updateProductDto.trackStock !== undefined && { trackStock: updateProductDto.trackStock }),
          ...(updateProductDto.active !== undefined && { active: updateProductDto.active }),
        },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          sku: true,
          barcode: true,
          salePrice: true,
          costPrice: true,
          category: true,
          stockQty: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          marginPct: true,
          expiryDate: true,
          unit: true,
          minStock: true,
          maxStock: true,
          trackStock: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const fields = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : String(error?.meta?.target ?? 'unique field');
        this.logger.warn(`Unique constraint violation on product update ${id}: ${fields}`);
        throw new ConflictException(`Já existe um produto com valor duplicado em: ${fields}`);
      }
      this.logger.error(`Unexpected error updating product ${id}`, error);
      throw error;
    }

    // Generate outbox event for synchronization
    await this.generateProductEvent(product, 'product.upserted.v1');

    return this.mapToResponseDto(product);
  }

  async remove(id: string): Promise<void> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete: marca o registro como inativo
    const updated = await this.prisma.product.update({
      where: { id },
      data: { active: false },
    });

    // Gerar evento de sincronização (alinha com Hub)
    await this.generateProductEvent(updated, 'product.deleted.v1');
  }

  private async generateProductEvent(product: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      marginPct: product.marginPct,
      expiryDate: product.expiryDate?.toISOString(),
      category: product.category,
      barcode: product.barcode,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      stockQty: product.stockQty,
      trackStock: product.trackStock,
      active: product.active,
      createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
    };

    // Store event in OutboxEvent table for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(eventPayload),
        processed: false,
      },
    });
  }

  private mapToResponseDto(product: any): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      sku: product.sku,
      barcode: product.barcode,
      price: product.salePrice,
      cost: product.costPrice,
      marginPct: product.marginPct,
      expiryDate: product.expiryDate,
      category: product.category,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      trackStock: product.trackStock ?? true, // Default value for required field
      active: product.active ?? true, // Default value for required field
      currentStock: product.stockQty || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}