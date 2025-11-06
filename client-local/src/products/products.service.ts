import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
// Import Prisma error classes defensively to detect validation errors
// Using runtime/library path for Prisma v6 compatibility
let PrismaClientValidationError: any;
let PrismaClientKnownRequestError: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaClientValidationError = require('@prisma/client/runtime/library').PrismaClientValidationError;
  PrismaClientKnownRequestError = require('@prisma/client/runtime/library').PrismaClientKnownRequestError;
} catch {}
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
    // Pre-validate fields that commonly trigger Prisma runtime errors
    if (createProductDto.expiryDate !== undefined) {
      const t = Date.parse(createProductDto.expiryDate);
      if (Number.isNaN(t)) {
        throw new BadRequestException('Campo expiryDate inválido. Use formato ISO (YYYY-MM-DD).');
      }
    }
    // Pre-validate numeric fields to avoid NaN/Infinity reaching Prisma/SQL
    if (createProductDto.price !== undefined) {
      const v = Number(createProductDto.price);
      if (!Number.isFinite(v) || Number.isNaN(v) || v < 0) {
        throw new BadRequestException('Campo price inválido. Use número decimal com ponto (ex: 39.90) e valor ≥ 0.');
      }
    }
    if (createProductDto.cost !== undefined) {
      const v = Number(createProductDto.cost);
      if (!Number.isFinite(v) || Number.isNaN(v) || v < 0) {
        throw new BadRequestException('Campo cost inválido. Use número decimal com ponto (ex: 19.90) e valor ≥ 0.');
      }
    }
    if (createProductDto.marginPct !== undefined) {
      const v = Number(createProductDto.marginPct);
      if (!Number.isFinite(v) || Number.isNaN(v)) {
        throw new BadRequestException('Campo marginPct inválido. Use número (ex: 15).');
      }
    }
    try {
      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          imageUrl: createProductDto.imageUrl,
          sku: createProductDto.sku,
          barcode: createProductDto.barcode,
          // Prisma DECIMAL pode falhar com number em alguns ambientes; forçar Number
          salePrice: createProductDto.price !== undefined ? Number(createProductDto.price) : undefined,
          costPrice: createProductDto.cost !== undefined ? Number(createProductDto.cost) : undefined,
          category: createProductDto.category,
          active: createProductDto.active ?? true,
          stockQty: 0,
          ...(createProductDto.marginPct !== undefined && { marginPct: createProductDto.marginPct }),
          ...(createProductDto.expiryDate !== undefined && { expiryDate: new Date(createProductDto.expiryDate) }),
          ...(createProductDto.unit !== undefined && { unit: createProductDto.unit }),
          ...(createProductDto.minStock !== undefined && { minStock: createProductDto.minStock }),
          ...(createProductDto.maxStock !== undefined && { maxStock: createProductDto.maxStock }),
          ...(createProductDto.trackStock !== undefined && { trackStock: createProductDto.trackStock }),
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

      // Generate outbox event for synchronization (best-effort)
      try {
        await this.generateProductEvent(product, 'product.upserted.v1');
      } catch (e) {
        // swallow any outbox errors
      }

      return this.mapToResponseDto(product);
    } catch (error: any) {
      // Map Prisma client validation errors (e.g., invalid types) to 400
      if (PrismaClientValidationError && error instanceof PrismaClientValidationError) {
        this.logger.warn(`Validation error on product create: ${error?.message}`);
        throw new BadRequestException('Payload inválido: verifique tipos numéricos e datas.');
      }
      // Map Prisma known request errors commonly caused by bad payload to 400
      {
        const code = error?.code;
        const cause = (error?.meta?.cause as string) || '';
        const badRequestCodes = new Set(['P2007', 'P2011', 'P2012', 'P2023', 'P2009']);
        if ((PrismaClientKnownRequestError && error instanceof PrismaClientKnownRequestError) || badRequestCodes.has(code)) {
          this.logger.warn(`Known request validation error on product create (${code || 'unknown'}): ${error?.message}`);
          throw new BadRequestException(cause ? `Payload inválido: ${cause}` : 'Payload inválido: verifique campos obrigatórios e tipos.');
        }
      }
      // Handle Prisma unique constraint errors gracefully
      if (error?.code === 'P2002') {
        const fields = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : String(error?.meta?.target ?? 'unique field');
        this.logger.warn(`Unique constraint violation on product create: ${fields}`);
        throw new ConflictException(`Já existe um produto com valor duplicado em: ${fields}`);
      }
      const msg = String(error?.message || '').toLowerCase();
      const isMissingTable = error?.code === 'P2021' || msg.includes('no such table') || msg.includes('does not exist');
      const isMissingColumn =
        msg.includes('no such column') ||
        msg.includes('unknown column') ||
        msg.includes('has no column') ||
        msg.includes('table has no column named');
      if (isMissingTable) {
        this.logger.warn('Tabela Product ausente em local.db. Criando tabela mínima e tentando novamente.');
        // Cria uma tabela mínima compatível com o create atual
        await this.prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Product" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "sku" TEXT,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "imageUrl" TEXT,
            "salePrice" DECIMAL NOT NULL,
            "costPrice" DECIMAL,
            "marginPct" REAL,
            "expiryDate" DATETIME,
            "stockQty" INTEGER NOT NULL DEFAULT 0,
            "category" TEXT,
            "barcode" TEXT,
            "unit" TEXT,
            "minStock" INTEGER,
            "maxStock" INTEGER,
            "trackStock" BOOLEAN NOT NULL DEFAULT 1,
            "active" BOOLEAN NOT NULL DEFAULT 1,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");`);
        await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Product_barcode_key" ON "Product"("barcode");`);

        // Tenta novamente usando Prisma
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
            ...(createProductDto.marginPct !== undefined && { marginPct: createProductDto.marginPct }),
            ...(createProductDto.expiryDate !== undefined && { expiryDate: new Date(createProductDto.expiryDate) }),
            ...(createProductDto.unit !== undefined && { unit: createProductDto.unit }),
            ...(createProductDto.minStock !== undefined && { minStock: createProductDto.minStock }),
            ...(createProductDto.maxStock !== undefined && { maxStock: createProductDto.maxStock }),
            ...(createProductDto.trackStock !== undefined && { trackStock: createProductDto.trackStock }),
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
        await this.generateProductEvent(product, 'product.upserted.v1');
        return this.mapToResponseDto(product);
      }
      if (isMissingColumn) {
        this.logger.warn('Esquema de Product desatualizado (coluna ausente). Inserindo via SQL em colunas antigas e retornando.');
        // Fallback para esquemas antigos: usa colunas "price" e "stock"
        const id = (global as any).crypto?.randomUUID?.() || require('crypto').randomUUID();
        const nowIso = new Date().toISOString();
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "Product" ("id","name","description","price","stock","category","barcode","active","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?)`,
          id,
          createProductDto.name,
          createProductDto.description ?? null,
          createProductDto.price,
          0,
          createProductDto.category ?? null,
          createProductDto.barcode ?? null,
          (createProductDto.active ?? true) ? 1 : 0,
          nowIso,
          nowIso,
        );
        // NÃO usar Prisma para selecionar campos inexistentes em esquemas antigos.
        // Em vez disso, construir objeto mínimo compatível com o DTO de resposta.
        const product = {
          id,
          name: createProductDto.name,
          description: createProductDto.description ?? null,
          imageUrl: createProductDto.imageUrl ?? null,
          sku: createProductDto.sku ?? null,
          barcode: createProductDto.barcode ?? null,
          salePrice: createProductDto.price,
          costPrice: createProductDto.cost ?? null,
          category: createProductDto.category ?? null,
          stockQty: 0,
          marginPct: createProductDto.marginPct ?? null,
          expiryDate: createProductDto.expiryDate ? new Date(createProductDto.expiryDate) : null,
          active: createProductDto.active ?? true,
          createdAt: new Date(nowIso),
          updatedAt: new Date(nowIso),
          unit: createProductDto.unit ?? null,
          minStock: createProductDto.minStock ?? null,
          maxStock: createProductDto.maxStock ?? null,
          trackStock: createProductDto.trackStock ?? true,
        } as any;
        try {
          await this.generateProductEvent(product, 'product.upserted.v1');
        } catch (e) {
          // evento é best-effort
        }
        return this.mapToResponseDto(product);
      }
      // Tentativa robusta: tentar inserir via SQL no esquema moderno; se falhar por coluna ausente, tentar legado
      try {
        const id = (global as any).crypto?.randomUUID?.() || require('crypto').randomUUID();
        const nowIso = new Date().toISOString();
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "Product" ("id","name","description","salePrice","costPrice","category","barcode","active","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?)`,
          id,
          createProductDto.name,
          createProductDto.description ?? null,
          Number(createProductDto.price),
          createProductDto.cost !== undefined ? Number(createProductDto.cost) : null,
          createProductDto.category ?? null,
          createProductDto.barcode ?? null,
          (createProductDto.active ?? true) ? 1 : 0,
          nowIso,
          nowIso,
        );
        const product = {
          id,
          name: createProductDto.name,
          description: createProductDto.description ?? null,
          imageUrl: createProductDto.imageUrl ?? null,
          sku: createProductDto.sku ?? null,
          barcode: createProductDto.barcode ?? null,
          salePrice: Number(createProductDto.price),
          costPrice: createProductDto.cost !== undefined ? Number(createProductDto.cost) : null,
          category: createProductDto.category ?? null,
          stockQty: 0,
          marginPct: createProductDto.marginPct ?? null,
          expiryDate: createProductDto.expiryDate ? new Date(createProductDto.expiryDate) : null,
          active: createProductDto.active ?? true,
          createdAt: new Date(nowIso),
          updatedAt: new Date(nowIso),
          unit: createProductDto.unit ?? null,
          minStock: createProductDto.minStock ?? null,
          maxStock: createProductDto.maxStock ?? null,
          trackStock: createProductDto.trackStock ?? true,
        } as any;
        try {
          await this.generateProductEvent(product, 'product.upserted.v1');
        } catch {}
        return this.mapToResponseDto(product);
      } catch (e2: any) {
        const msg2 = String(e2?.message || '').toLowerCase();
        const missingCol2 =
          e2?.code === 'P2021' ||
          msg2.includes('no such column') ||
          msg2.includes('unknown column') ||
          msg2.includes('has no column') ||
          msg2.includes('table has no column named');
        if (missingCol2) {
          this.logger.warn('Esquema moderno indisponível; inserindo via colunas antigas (price/stock).');
          const id = (global as any).crypto?.randomUUID?.() || require('crypto').randomUUID();
          const nowIso = new Date().toISOString();
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO "Product" ("id","name","description","price","stock","category","barcode","active","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?)`,
            id,
            createProductDto.name,
            createProductDto.description ?? null,
            Number(createProductDto.price),
            0,
            createProductDto.category ?? null,
            createProductDto.barcode ?? null,
            (createProductDto.active ?? true) ? 1 : 0,
            nowIso,
            nowIso,
          );
          const product = {
            id,
            name: createProductDto.name,
            description: createProductDto.description ?? null,
            imageUrl: createProductDto.imageUrl ?? null,
            sku: createProductDto.sku ?? null,
            barcode: createProductDto.barcode ?? null,
            salePrice: Number(createProductDto.price),
            costPrice: createProductDto.cost ?? null,
            category: createProductDto.category ?? null,
            stockQty: 0,
            marginPct: createProductDto.marginPct ?? null,
            expiryDate: createProductDto.expiryDate ? new Date(createProductDto.expiryDate) : null,
            active: createProductDto.active ?? true,
            createdAt: new Date(nowIso),
            updatedAt: new Date(nowIso),
            unit: createProductDto.unit ?? null,
            minStock: createProductDto.minStock ?? null,
            maxStock: createProductDto.maxStock ?? null,
            trackStock: createProductDto.trackStock ?? true,
          } as any;
          try {
            await this.generateProductEvent(product, 'product.upserted.v1');
          } catch {}
          return this.mapToResponseDto(product);
        }
        this.logger.error('Unexpected error creating product (raw SQL path also failed)', e2);
      }
      // Se não foi tratado acima, aplicar heurística para mapear mensagens comuns de validação para 400
      const looksLikeValidation = (
        msg.includes('missing required value') ||
        msg.includes('argument') && msg.includes('expected') ||
        msg.includes('invalid') && (msg.includes('value') || msg.includes('input'))
      );
      if (looksLikeValidation) {
        this.logger.warn(`Heuristic validation mapping for product create: ${error?.message}`);
        throw new BadRequestException('Payload inválido: verifique campos obrigatórios e tipos.');
      }
      this.logger.error('Unexpected error creating product', error);
      throw error;
    }
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const isMissingTableError = (err: any): boolean => {
      const msg = String(err?.message || '').toLowerCase();
      return err?.code === 'P2021' || msg.includes('no such table') || msg.includes('does not exist');
    };

    try {
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
    } catch (error: any) {
      if (isMissingTableError(error)) {
        this.logger.warn('Products table missing in local.db, returning empty list');
        return [];
      }
      this.logger.warn(`Falling back to minimal product selection due to schema mismatch: ${error?.message}`);
      try {
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
          },
        });
        return products.map(product => this.mapToResponseDto(product));
      } catch (error2: any) {
        if (isMissingTableError(error2)) {
          this.logger.warn('Products table missing in local.db (fallback), returning empty list');
          return [];
        }
        throw error2;
      }
    }
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

    // Pre-validate fields to avoid runtime 500s
    if (updateProductDto.expiryDate !== undefined) {
      const t = Date.parse(updateProductDto.expiryDate as any);
      if (Number.isNaN(t)) {
        throw new BadRequestException('Campo expiryDate inválido. Use formato ISO (YYYY-MM-DD).');
      }
    }
    // Pre-validate numeric fields on update as well
    if (updateProductDto.price !== undefined) {
      const v = Number(updateProductDto.price);
      if (!Number.isFinite(v) || Number.isNaN(v) || v < 0) {
        throw new BadRequestException('Campo price inválido. Use número decimal com ponto (ex: 39.90) e valor ≥ 0.');
      }
    }
    if (updateProductDto.cost !== undefined) {
      const v = Number(updateProductDto.cost);
      if (!Number.isFinite(v) || Number.isNaN(v) || v < 0) {
        throw new BadRequestException('Campo cost inválido. Use número decimal com ponto (ex: 19.90) e valor ≥ 0.');
      }
    }
    if (updateProductDto.marginPct !== undefined) {
      const v = Number(updateProductDto.marginPct as any);
      if (!Number.isFinite(v) || Number.isNaN(v)) {
        throw new BadRequestException('Campo marginPct inválido. Use número (ex: 15).');
      }
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
      if (PrismaClientValidationError && error instanceof PrismaClientValidationError) {
        this.logger.warn(`Validation error on product update ${id}: ${error?.message}`);
        throw new BadRequestException('Payload inválido: verifique tipos numéricos e datas.');
      }
      if (PrismaClientKnownRequestError && error instanceof PrismaClientKnownRequestError) {
        const code = error?.code;
        const cause = (error?.meta?.cause as string) || '';
        const badRequestCodes = new Set(['P2007', 'P2011', 'P2012', 'P2023', 'P2009']);
        if (badRequestCodes.has(code)) {
          this.logger.warn(`Known request validation error on product update ${id} (${code}): ${error?.message}`);
          throw new BadRequestException(cause ? `Payload inválido: ${cause}` : 'Payload inválido: verifique campos obrigatórios e tipos.');
        }
      }
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
    try {
      await this.prisma.outboxEvent.create({
        data: {
          eventType,
          payload: JSON.stringify(eventPayload),
          processed: false,
        },
      });
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase();
      const isMissingTable = error?.code === 'P2021' || msg.includes('no such table') || msg.includes('does not exist');
      const isMissingColumn = msg.includes('no such column') || msg.includes('unknown column') || msg.includes('has no column');
      if (isMissingTable || isMissingColumn) {
        this.logger.warn(`OutboxEvent indisponível (${error?.code || 'schema mismatch'}). Evento não persistido (best-effort).`);
        return; // não falha a requisição
      }
      this.logger.warn(`Falha ao persistir evento ${eventType}: ${error?.message}`);
      return; // qualquer erro na outbox não deve quebrar a chamada
    }
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