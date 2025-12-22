import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

type MinimalProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sku: string | null;
  barcode: string | null;
  salePrice: any;
  costPrice: any;
  category: string | null;
  stockQty: number;
  marginPct?: any;
  expiryDate?: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  unit?: string | null;
  minStock?: any;
  maxStock?: any;
  trackStock?: boolean | null;
};

function getErrorInfo(error: unknown): {
  name?: string;
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
} {
  const e = error as Record<string, unknown> | undefined;
  return {
    name: (e?.name as string) || undefined,
    code: (e?.code as string) || undefined,
    message: (e?.message as string) || undefined,
    meta: (e?.meta as Record<string, unknown>) || undefined,
  };
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private productColumnsCache?: Set<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  private async getProductColumns(forceRefresh = false): Promise<Set<string>> {
    if (this.productColumnsCache && !forceRefresh) return this.productColumnsCache;
    const rows = (await this.prisma.$queryRawUnsafe(`PRAGMA table_info("Product")`)) as Array<{ name?: unknown }>;
    const cols = new Set<string>((rows || []).map((r) => String(r?.name || '')).filter(Boolean));
    this.productColumnsCache = cols;
    return cols;
  }

  private mapRowToMinimalProduct(row: any, columns: Set<string>): MinimalProduct {
    const salePrice = columns.has('salePrice') ? row.salePrice : columns.has('price') ? row.price : 0;
    const stockQty = columns.has('stockQty') ? row.stockQty : columns.has('stock') ? row.stock : 0;

    return {
      id: String(row.id),
      name: String(row.name ?? ''),
      description: row.description ?? null,
      imageUrl: row.imageUrl ?? null,
      sku: row.sku ?? null,
      barcode: row.barcode ?? null,
      salePrice,
      costPrice: row.costPrice ?? null,
      category: row.category ?? null,
      stockQty: typeof stockQty === 'number' ? stockQty : Number(stockQty ?? 0),
      marginPct: row.marginPct ?? null,
      expiryDate: row.expiryDate ? this.toDate(row.expiryDate) : null,
      active: this.toBool(row.active, true),
      createdAt: row.createdAt ? this.toDate(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? this.toDate(row.updatedAt) : new Date(),
      unit: row.unit ?? null,
      minStock: row.minStock ?? null,
      maxStock: row.maxStock ?? null,
      trackStock: row.trackStock !== undefined ? this.toBool(row.trackStock, true) : true,
    };
  }

  private async findOneRaw(id: string, columns: Set<string>): Promise<MinimalProduct> {
    const desired = [
      'id',
      'name',
      'description',
      'imageUrl',
      'sku',
      'barcode',
      'category',
      'active',
      'createdAt',
      'updatedAt',
      'salePrice',
      'price',
      'costPrice',
      'stockQty',
      'stock',
      'marginPct',
      'expiryDate',
      'unit',
      'minStock',
      'maxStock',
      'trackStock',
    ];
    const selectCols = desired.filter((c) => columns.has(c));
    const selectSql =
      selectCols.length > 0
        ? `SELECT ${selectCols.map((c) => `"${c}" as "${c}"`).join(', ')} FROM "Product" WHERE "id" = ? LIMIT 1`
        : `SELECT "id" as "id" FROM "Product" WHERE "id" = ? LIMIT 1`;

    const rows = (await this.prisma.$queryRawUnsafe(selectSql, id)) as any[];
    const row = rows?.[0];
    if (!row) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.mapRowToMinimalProduct(row, columns);
  }

  private async findAllRaw(columns: Set<string>): Promise<MinimalProduct[]> {
    const desired = [
      'id',
      'name',
      'description',
      'imageUrl',
      'sku',
      'barcode',
      'category',
      'active',
      'createdAt',
      'updatedAt',
      'salePrice',
      'price',
      'costPrice',
      'stockQty',
      'stock',
      'marginPct',
      'expiryDate',
      'unit',
      'minStock',
      'maxStock',
      'trackStock',
    ];
    const selectCols = desired.filter((c) => columns.has(c));
    const selectSql =
      selectCols.length > 0
        ? `SELECT ${selectCols.map((c) => `"${c}" as "${c}"`).join(', ')} FROM "Product" ORDER BY "name" ASC`
        : `SELECT "id" as "id", "name" as "name" FROM "Product" ORDER BY "name" ASC`;

    const rows = (await this.prisma.$queryRawUnsafe(selectSql)) as any[];
    return (rows || []).map((r) => this.mapRowToMinimalProduct(r, columns));
  }

  private toDate(v: any): Date {
    if (v instanceof Date) return v;
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  private toBool(v: any, defaultValue = true): boolean {
    if (v === undefined || v === null) return defaultValue;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    const s = String(v).trim().toLowerCase();
    if (['1', 'true', 'yes', 'sim'].includes(s)) return true;
    if (['0', 'false', 'no', 'nao', 'não'].includes(s)) return false;
    return defaultValue;
  }

  private async updateProductRaw(id: string, dto: UpdateProductDto, columns: Set<string>): Promise<MinimalProduct> {
    const setClauses: string[] = [];
    const values: any[] = [];
    const nowIso = new Date().toISOString();

    const add = (col: string, value: any) => {
      if (!columns.has(col)) return;
      setClauses.push(`"${col}" = ?`);
      values.push(value);
    };

    if (dto.name !== undefined) add('name', dto.name);
    if (dto.description !== undefined) add('description', dto.description ?? null);
    if (dto.imageUrl !== undefined) add('imageUrl', dto.imageUrl ?? null);
    if (dto.sku !== undefined) add('sku', dto.sku ?? null);
    if (dto.barcode !== undefined) add('barcode', dto.barcode ?? null);
    if (dto.category !== undefined) add('category', dto.category ?? null);
    if (dto.unit !== undefined) add('unit', dto.unit ?? null);
    if (dto.minStock !== undefined) add('minStock', dto.minStock ?? null);
    if (dto.maxStock !== undefined) add('maxStock', dto.maxStock ?? null);
    if (dto.trackStock !== undefined) add('trackStock', dto.trackStock ? 1 : 0);
    if (dto.active !== undefined) add('active', dto.active ? 1 : 0);
    if (dto.marginPct !== undefined) add('marginPct', dto.marginPct ?? null);
    if (dto.expiryDate !== undefined) add('expiryDate', dto.expiryDate ? new Date(dto.expiryDate).toISOString() : null);

    if (dto.price !== undefined) {
      const priceCol = columns.has('salePrice') ? 'salePrice' : columns.has('price') ? 'price' : undefined;
      if (priceCol) add(priceCol, Number(dto.price));
    }
    if (dto.cost !== undefined) {
      if (columns.has('costPrice')) add('costPrice', dto.cost !== undefined && dto.cost !== null ? Number(dto.cost) : null);
    }

    if (columns.has('updatedAt')) add('updatedAt', nowIso);

    if (setClauses.length > 0) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Product" SET ${setClauses.join(', ')} WHERE "id" = ?`,
        ...values,
        id,
      );
    }

    const desired = [
      'id',
      'name',
      'description',
      'imageUrl',
      'sku',
      'barcode',
      'category',
      'active',
      'createdAt',
      'updatedAt',
      'salePrice',
      'price',
      'costPrice',
      'stockQty',
      'stock',
      'marginPct',
      'expiryDate',
      'unit',
      'minStock',
      'maxStock',
      'trackStock',
    ];
    const selectCols = desired.filter((c) => columns.has(c));
    const selectSql =
      selectCols.length > 0
        ? `SELECT ${selectCols.map((c) => `"${c}" as "${c}"`).join(', ')} FROM "Product" WHERE "id" = ? LIMIT 1`
        : `SELECT "id" as "id" FROM "Product" WHERE "id" = ? LIMIT 1`;

    const rows = (await this.prisma.$queryRawUnsafe(selectSql, id)) as any[];
    const row = rows?.[0];
    if (!row) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const salePrice = columns.has('salePrice') ? row.salePrice : columns.has('price') ? row.price : undefined;
    const stockQty = columns.has('stockQty') ? row.stockQty : columns.has('stock') ? row.stock : 0;

    return {
      id: String(row.id),
      name: String(row.name ?? dto.name ?? ''),
      description: row.description ?? (dto.description ?? null),
      imageUrl: row.imageUrl ?? (dto.imageUrl ?? null),
      sku: row.sku ?? (dto.sku ?? null),
      barcode: row.barcode ?? (dto.barcode ?? null),
      salePrice: salePrice ?? (dto.price !== undefined ? Number(dto.price) : 0),
      costPrice: row.costPrice ?? (dto.cost !== undefined ? Number(dto.cost) : null),
      category: row.category ?? (dto.category ?? null),
      stockQty: typeof stockQty === 'number' ? stockQty : Number(stockQty ?? 0),
      marginPct: row.marginPct ?? (dto.marginPct ?? null),
      expiryDate: row.expiryDate ? this.toDate(row.expiryDate) : dto.expiryDate ? new Date(dto.expiryDate) : null,
      active: this.toBool(row.active, dto.active ?? true),
      createdAt: row.createdAt ? this.toDate(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? this.toDate(row.updatedAt) : new Date(),
      unit: row.unit ?? (dto.unit ?? null),
      minStock: row.minStock ?? (dto.minStock ?? null),
      maxStock: row.maxStock ?? (dto.maxStock ?? null),
      trackStock: row.trackStock !== undefined ? this.toBool(row.trackStock, true) : dto.trackStock ?? true,
    };
  }

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Pre-validate fields that commonly trigger Prisma runtime errors
    if (createProductDto.expiryDate !== undefined) {
      const t = Date.parse(createProductDto.expiryDate as string);
      if (Number.isNaN(t)) {
        throw new BadRequestException('Campo expiryDate inválido. Use formato ISO (YYYY-MM-DD).');
      }
      const year = new Date(t).getFullYear();
      if (year > 3000) {
        throw new BadRequestException('Ano de validade inválido (ano > 3000).');
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
          salePrice: Number(createProductDto.price),
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
        /* ignore errors (best-effort event) */
      }

      return this.mapToResponseDto(product);
    } catch (error: unknown) {
      // Handle Prisma unique constraint errors gracefully (Moved up to prioritize over generic KnownRequestError)
      {
        const { code, meta } = getErrorInfo(error);
        if (code === 'P2002') {
          const target = meta?.target as unknown;
          const fields = Array.isArray(target) ? (target as unknown[]).map(String).join(', ') : String(target ?? 'unique field');
          this.logger.warn(`Unique constraint violation on product create: ${fields}`);
          throw new ConflictException(`Já existe um produto com valor duplicado em: ${fields}`);
        }
      }

      // Map Prisma client validation errors (e.g., invalid types) to 400
      {
        const { name, message } = getErrorInfo(error);
        if (name === 'PrismaClientValidationError') {
          this.logger.warn(`Validation error on product create: ${message}`);
          throw new BadRequestException('Payload inválido: verifique tipos numéricos e datas.');
        }
      }
      // Map Prisma known request errors commonly caused by bad payload to 400
      {
        const { code, meta, name, message } = getErrorInfo(error);
        const cause = (meta?.cause as string) || '';
        const badRequestCodes = new Set(['P2007', 'P2011', 'P2012', 'P2023', 'P2009']);
        // Only handle if NOT P2002 (though P2002 is already handled above)
        if ((name === 'PrismaClientKnownRequestError' && code !== 'P2002') || badRequestCodes.has(code || '')) {
          this.logger.warn(`Known request validation error on product create (${code || 'unknown'}): ${message}`);
          throw new BadRequestException(cause ? `Payload inválido: ${cause}` : 'Payload inválido: verifique campos obrigatórios e tipos.');
        }
      }
      
      const { message, code } = getErrorInfo(error);
      const msg = String(message || '').toLowerCase();
      const isMissingTable = code === 'P2021' || msg.includes('no such table') || msg.includes('does not exist');
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
        const id = randomUUID();
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
        const product: MinimalProduct = {
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
        };
        try {
          await this.generateProductEvent(product, 'product.upserted.v1');
        } catch (e) {
          /* ignore errors (best-effort event) */
        }
        return this.mapToResponseDto(product);
      }
      // Tentativa robusta: tentar inserir via SQL no esquema moderno; se falhar por coluna ausente, tentar legado
      try {
        const id = randomUUID();
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
        const product: MinimalProduct = {
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
        };
        try {
          await this.generateProductEvent(product, 'product.upserted.v1');
        } catch { /* ignore errors (best-effort event) */ }
        return this.mapToResponseDto(product);
      } catch (e2: unknown) {
        const { message, code } = getErrorInfo(e2);
        const msg2 = String(message || '').toLowerCase();
        const missingCol2 =
          code === 'P2021' ||
          msg2.includes('no such column') ||
          msg2.includes('unknown column') ||
          msg2.includes('has no column') ||
          msg2.includes('table has no column named');
        if (missingCol2) {
          this.logger.warn('Esquema moderno indisponível; inserindo via colunas antigas (price/stock).');
          const id = randomUUID();
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
          const product: MinimalProduct = {
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
          };
          try {
            await this.generateProductEvent(product, 'product.upserted.v1');
          } catch { /* ignore errors (best-effort event) */ }
          return this.mapToResponseDto(product);
        }
        this.logger.error('Unexpected error creating product (raw SQL path also failed)', e2 as Error);
      }
      // Se não foi tratado acima, aplicar heurística para mapear mensagens comuns de validação para 400
      const looksLikeValidation = (
        msg.includes('missing required value') ||
        msg.includes('argument') && msg.includes('expected') ||
        msg.includes('invalid') && (msg.includes('value') || msg.includes('input'))
      );
      if (looksLikeValidation) {
        const { message: m } = getErrorInfo(error);
        this.logger.warn(`Heuristic validation mapping for product create: ${m}`);
        throw new BadRequestException('Payload inválido: verifique campos obrigatórios e tipos.');
      }
      this.logger.error('Unexpected error creating product', error as Error);
      throw error;
    }
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const isMissingTableError = (err: any): boolean => {
      const msg = String(err?.message || '').toLowerCase();
      return err?.code === 'P2021' || msg.includes('no such table') || msg.includes('does not exist');
    };

    try {
      const productColumns = await this.getProductColumns();
      if (productColumns.size > 0) {
        const products = await this.findAllRaw(productColumns);
        return products.map((product) => this.mapToResponseDto(product));
      }
    } catch (error) {
      void error;
    }

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
    } catch (error: unknown) {
      if (isMissingTableError(error)) {
        this.logger.warn('Products table missing in local.db, returning empty list');
        return [];
      }
      const { message } = getErrorInfo(error);
      this.logger.warn(`Falling back to minimal product selection due to schema mismatch: ${message}`);
      try {
        try {
          const productColumns = await this.getProductColumns(true);
          if (productColumns.size > 0) {
            const products = await this.findAllRaw(productColumns);
            return products.map((product) => this.mapToResponseDto(product));
          }
        } catch (error) {
          void error;
        }
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
      } catch (error2: unknown) {
        if (isMissingTableError(error2)) {
          this.logger.warn('Products table missing in local.db (fallback), returning empty list');
          return [];
        }
        throw error2;
      }
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      const productColumns = await this.getProductColumns();
      if (productColumns.size > 0) {
        const product = await this.findOneRaw(id, productColumns);
        return this.mapToResponseDto(product);
      }
    } catch (error) {
      void error;
    }

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
    let productColumns: Set<string> | undefined;
    try {
      productColumns = await this.getProductColumns();
    } catch {
      productColumns = undefined;
    }

    if (productColumns && productColumns.size > 0) {
      const hasLegacyPrice = productColumns.has('price') && !productColumns.has('salePrice');
      const hasLegacyStock = productColumns.has('stock') && !productColumns.has('stockQty');
      if (hasLegacyPrice || hasLegacyStock) {
        const productRaw = await this.updateProductRaw(id, updateProductDto, productColumns);
        await this.generateProductEvent(productRaw, 'product.upserted.v1');
        return this.mapToResponseDto(productRaw);
      }
    }

    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Pre-validate fields to avoid runtime 500s
    if (updateProductDto.expiryDate !== undefined) {
      const t = Date.parse(updateProductDto.expiryDate as string);
      if (Number.isNaN(t)) {
        throw new BadRequestException('Campo expiryDate inválido. Use formato ISO (YYYY-MM-DD).');
      }
      const year = new Date(t).getFullYear();
      if (year > 3000) {
        throw new BadRequestException('Ano de validade inválido (ano > 3000).');
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
      const v = Number(updateProductDto.marginPct as number);
      if (!Number.isFinite(v) || Number.isNaN(v)) {
        throw new BadRequestException('Campo marginPct inválido. Use número (ex: 15).');
      }
    }
    let product;
    try {
      const select: any = {
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
      };
      if (productColumns?.has('unit')) select.unit = true;
      if (productColumns?.has('maxStock')) select.maxStock = true;
      if (productColumns?.has('trackStock')) select.trackStock = true;

      const data: any = {
        ...(updateProductDto.name !== undefined && { name: updateProductDto.name }),
        ...(updateProductDto.description !== undefined && { description: updateProductDto.description }),
        ...(updateProductDto.imageUrl !== undefined && { imageUrl: updateProductDto.imageUrl }),
        ...(updateProductDto.sku !== undefined && { sku: updateProductDto.sku }),
        ...(updateProductDto.barcode !== undefined && { barcode: updateProductDto.barcode }),
        ...(updateProductDto.price !== undefined && { salePrice: updateProductDto.price }),
        ...(updateProductDto.cost !== undefined && { costPrice: updateProductDto.cost }),
        ...(updateProductDto.marginPct !== undefined && { marginPct: updateProductDto.marginPct }),
        ...(updateProductDto.expiryDate !== undefined && { expiryDate: new Date(updateProductDto.expiryDate) }),
        ...(updateProductDto.category !== undefined && { category: updateProductDto.category }),
        ...(updateProductDto.minStock !== undefined && { minStock: updateProductDto.minStock }),
        ...(updateProductDto.active !== undefined && { active: updateProductDto.active }),
      };
      if (productColumns?.has('unit') && updateProductDto.unit !== undefined) data.unit = updateProductDto.unit;
      if (productColumns?.has('maxStock') && updateProductDto.maxStock !== undefined) data.maxStock = updateProductDto.maxStock;
      if (productColumns?.has('trackStock') && updateProductDto.trackStock !== undefined) data.trackStock = updateProductDto.trackStock;

      product = await this.prisma.product.update({
        where: { id },
        data,
        select,
      });
    } catch (error: unknown) {
      const { message, code } = getErrorInfo(error);
      const msg = String(message || '').toLowerCase();
      const isMissingTable = code === 'P2021' || msg.includes('no such table') || msg.includes('does not exist');
      const isMissingColumn =
        msg.includes('no such column') ||
        msg.includes('unknown column') ||
        msg.includes('has no column') ||
        msg.includes('table has no column named');
      if (isMissingTable || isMissingColumn) {
        const cols = await this.getProductColumns(true);
        const productRaw = await this.updateProductRaw(id, updateProductDto, cols);
        await this.generateProductEvent(productRaw, 'product.upserted.v1');
        return this.mapToResponseDto(productRaw);
      }
      {
        const { name, message } = getErrorInfo(error);
        if (name === 'PrismaClientValidationError') {
          this.logger.warn(`Validation error on product update ${id}: ${message}`);
          throw new BadRequestException('Payload inválido: verifique tipos numéricos e datas.');
        }
      }
      {
        const { code, meta, name, message } = getErrorInfo(error);
        const cause = (meta?.cause as string) || '';
        const badRequestCodes = new Set(['P2007', 'P2011', 'P2012', 'P2023', 'P2009']);
        if (name === 'PrismaClientKnownRequestError' || badRequestCodes.has(code || '')) {
          this.logger.warn(`Known request validation error on product update ${id} (${code}): ${message}`);
          throw new BadRequestException(cause ? `Payload inválido: ${cause}` : 'Payload inválido: verifique campos obrigatórios e tipos.');
        }
      }
      {
        const { code, meta } = getErrorInfo(error);
        if (code === 'P2002') {
          const target = meta?.target as unknown;
          const fields = Array.isArray(target) ? (target as unknown[]).map(String).join(', ') : String(target ?? 'unique field');
          this.logger.warn(`Unique constraint violation on product update ${id}: ${fields}`);
          throw new ConflictException(`Já existe um produto com valor duplicado em: ${fields}`);
        }
      }
      this.logger.error(`Unexpected error updating product ${id}`, error as Error);
      throw error;
    }

    // Generate outbox event for synchronization
    await this.generateProductEvent(product, 'product.upserted.v1');

    return this.mapToResponseDto(product);
  }

  async remove(id: string, hard = false): Promise<void> {
    let productColumns: Set<string> | undefined;
    try {
      productColumns = await this.getProductColumns();
    } catch {
      productColumns = undefined;
    }

    if (productColumns && productColumns.size > 0) {
      const existingProduct = await this.findOneRaw(id, productColumns);

      if (hard) {
        try {
          await this.prisma.$executeRawUnsafe(`DELETE FROM "Product" WHERE "id" = ?`, id);
          await this.generateProductEvent({ ...existingProduct, active: false }, 'product.deleted.v1');
          return;
        } catch (error: any) {
          const msg = String(error?.message || '').toLowerCase();
          const isFkConstraint = msg.includes('foreign key') || msg.includes('constraint');
          if (isFkConstraint) {
            throw new ConflictException('Não é possível excluir permanentemente: o produto possui registros vinculados (vendas, estoque ou ajustes). Inative o produto ou remova os vínculos antes.');
          }
          throw error;
        }
      }

      if (!productColumns.has('active')) {
        throw new ConflictException('Não é possível inativar: a coluna active não existe no banco local.');
      }

      const updated = await this.updateProductRaw(id, { active: false } as UpdateProductDto, productColumns);
      await this.generateProductEvent(updated, 'product.deleted.v1');
      return;
    }

    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        active: true,
        salePrice: true,
        costPrice: true,
        category: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        stockQty: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (hard) {
      try {
        await this.prisma.product.delete({ where: { id } });
        await this.generateProductEvent({ ...existingProduct, active: false }, 'product.deleted.v1');
        return;
      } catch (error: any) {
        const msg = String(error?.message || '').toLowerCase();
        const isFkConstraint = error?.code === 'P2003' || msg.includes('foreign key') || msg.includes('constraint');
        if (isFkConstraint) {
          throw new ConflictException('Não é possível excluir permanentemente: o produto possui registros vinculados (vendas, estoque ou ajustes). Inative o produto ou remova os vínculos antes.');
        }
        throw error;
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { active: false },
    });

    await this.generateProductEvent(updated, 'product.deleted.v1');
  }

  async getDependencies(id: string): Promise<{
    blocking: {
      saleItems: number;
      stockMovements: number;
      inventoryAdjustments: number;
    };
    nonBlocking: {
      groomingItems: number;
    };
    canHardDelete: boolean;
  }> {
    const [saleItems, stockMovements, inventoryAdjustments, groomingItems] = await Promise.all([
      this.prisma.saleItem.count({ where: { productId: id } }),
      this.prisma.stockMovement.count({ where: { productId: id } }),
      this.prisma.inventoryAdjustment.count({ where: { productId: id } }),
      this.prisma.groomingItem.count({ where: { productId: id } }),
    ]);

    const blockingTotal = saleItems + stockMovements + inventoryAdjustments;
    return {
      blocking: { saleItems, stockMovements, inventoryAdjustments },
      nonBlocking: { groomingItems },
      canHardDelete: blockingTotal === 0,
    };
  }

  private async generateProductEvent(product: MinimalProduct, eventType: string): Promise<void> {
    const eventPayload = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      marginPct: product.marginPct,
      expiryDate: product.expiryDate ? product.expiryDate.toISOString() : undefined,
      category: product.category,
      barcode: product.barcode,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      stockQty: product.stockQty,
      trackStock: product.trackStock ?? true,
      active: product.active,
      createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: product.updatedAt ? product.updatedAt.toISOString() : undefined,
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
    } catch (error: unknown) {
      const { message, code } = getErrorInfo(error);
      const msg = String(message || '').toLowerCase();
      const isMissingTable = code === 'P2021' || msg.includes('no such table') || msg.includes('does not exist');
      const isMissingColumn =
        msg.includes('no such column') ||
        msg.includes('unknown column') ||
        msg.includes('has no column') ||
        msg.includes('table has no column named');
      if (isMissingTable || isMissingColumn) {
        this.logger.warn(`OutboxEvent indisponível (${code || 'schema mismatch'}). Evento não persistido (best-effort).`);
        return; // não falha a requisição
      }
      this.logger.warn(`Falha ao persistir evento ${eventType}: ${message}`);
      return; // qualquer erro na outbox não deve quebrar a chamada
    }
  }

  private mapToResponseDto(product: MinimalProduct): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? undefined,
      imageUrl: product.imageUrl ?? undefined,
      sku: product.sku ?? undefined,
      barcode: product.barcode ?? undefined,
      price: Number(product.salePrice),
      cost: product.costPrice !== null && product.costPrice !== undefined ? Number(product.costPrice) : undefined,
      marginPct: product.marginPct !== null && product.marginPct !== undefined ? Number(product.marginPct) : undefined,
      expiryDate: product.expiryDate ?? undefined,
      category: product.category ?? undefined,
      unit: product.unit ?? undefined,
      minStock: product.minStock !== null && product.minStock !== undefined ? Number(product.minStock) : undefined,
      maxStock: product.maxStock !== null && product.maxStock !== undefined ? Number(product.maxStock) : undefined,
      trackStock: product.trackStock ?? true,
      active: product.active ?? true,
      currentStock: product.stockQty || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
