import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        sku: createProductDto.sku,
        barcode: createProductDto.barcode,
        salePrice: createProductDto.price,
        costPrice: createProductDto.cost,
        category: createProductDto.category,
        unit: createProductDto.unit,
        minStock: createProductDto.minStock,
        maxStock: createProductDto.maxStock,
        trackStock: createProductDto.trackStock ?? true,
        active: createProductDto.active ?? true,
        stockQty: 0, // Initialize with 0 stock
      },
    });

    // Generate outbox event for synchronization
    await this.generateProductEvent(product, 'product.upserted.v1');

    return this.mapToResponseDto(product);
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return products.map(product => this.mapToResponseDto(product));
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.mapToResponseDto(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(updateProductDto.name && { name: updateProductDto.name }),
        ...(updateProductDto.description !== undefined && { description: updateProductDto.description }),
        ...(updateProductDto.sku !== undefined && { sku: updateProductDto.sku }),
        ...(updateProductDto.barcode !== undefined && { barcode: updateProductDto.barcode }),
        ...(updateProductDto.price !== undefined && { salePrice: updateProductDto.price }),
        ...(updateProductDto.cost !== undefined && { costPrice: updateProductDto.cost }),
        ...(updateProductDto.category !== undefined && { category: updateProductDto.category }),
        ...(updateProductDto.unit !== undefined && { unit: updateProductDto.unit }),
        ...(updateProductDto.minStock !== undefined && { minStock: updateProductDto.minStock }),
        ...(updateProductDto.maxStock !== undefined && { maxStock: updateProductDto.maxStock }),
        ...(updateProductDto.trackStock !== undefined && { trackStock: updateProductDto.trackStock }),
        ...(updateProductDto.active !== undefined && { active: updateProductDto.active }),
      },
    });

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

    // Soft delete by setting active to false
    const product = await this.prisma.product.update({
      where: { id },
      data: { active: false },
    });

    // Generate outbox event for synchronization
    await this.generateProductEvent(product, 'product.deleted.v1');
  }

  private async generateProductEvent(product: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      category: product.category,
      barcode: product.barcode,
      active: product.active,
      stockQty: product.stockQty,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      trackStock: product.trackStock,
      createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
    };

    // Add deletedAt for delete events
    if (eventType === 'product.deleted.v1') {
      (eventPayload as any).deletedAt = new Date().toISOString();
    }

    // Validate event payload using Ajv
    const validationResult = this.eventValidator.validateEvent(eventType, eventPayload);
    if (!validationResult.valid) {
      this.logger.error(`Event validation failed for ${eventType}:`, validationResult.errors);
      throw new Error(`Invalid event payload: ${validationResult.errors?.join(', ')}`);
    }

    // Persist event to OutboxEvent table for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        aggregate: 'product',
        aggregateId: product.id,
        type: eventType,
        payload: JSON.stringify(eventPayload),
      },
    });

    this.logger.debug(`Generated ${eventType} event for product ${product.id}`);
  }

  private mapToResponseDto(product: any): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      price: product.salePrice,
      cost: product.costPrice,
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