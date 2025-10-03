import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto, SaleItemResponseDto } from './dto/sale-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async createSale(createSaleDto: CreateSaleDto): Promise<SaleResponseDto> {
    this.logger.log('Creating new sale');

    // Calculate total
    const total = createSaleDto.items.reduce(
      (sum, item) => sum + (item.qty * item.unitPrice),
      0
    );

    // Generate sale code
    const saleCode = `SALE-${Date.now()}`;

    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        // Create sale
        const sale = await tx.sale.create({
          data: {
            id: uuidv4(),
            code: saleCode,
            operator: createSaleDto.operator,
            payment: createSaleDto.payment,
            status: 'completed',
            total,
            customerId: createSaleDto.customerId,
          },
        });

        // Create sale items
        const saleItems = await Promise.all(
          createSaleDto.items.map(async (item) => {
            const subtotal = item.qty * item.unitPrice;
            return tx.saleItem.create({
              data: {
                id: uuidv4(),
                saleId: sale.id,
                productId: item.productId,
                qty: item.qty,
                unitPrice: item.unitPrice,
                subtotal,
              },
            });
          })
        );

        // Generate and validate event
        const eventPayload = {
          id: sale.id,
          code: sale.code,
          operator: sale.operator,
          payment: sale.payment,
          total: sale.total,
          customerId: sale.customerId,
          createdAt: sale.createdAt.toISOString(),
          items: saleItems.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        };

        // Validate event before storing
        const validationResult = this.eventValidator.validateEvent('sale.created.v1', eventPayload);
        if (!validationResult.valid) {
          this.logger.error('Event validation failed', { errors: validationResult.errors });
          throw new Error(`Event validation failed: ${validationResult.errors?.join(', ')}`);
        }

        // Store event in outbox
        await tx.outboxEvent.create({
          data: {
            id: uuidv4(),
            eventType: 'sale.created.v1',
            payload: JSON.stringify(eventPayload),
            createdAt: new Date(),
          },
        });

        this.logger.log(`Sale created successfully: ${sale.id}`);

        return {
          sale,
          items: saleItems,
        };
      });

      // Return formatted response
      return {
        id: result.sale.id,
        code: result.sale.code,
        operator: result.sale.operator,
        payment: result.sale.payment,
        status: result.sale.status,
        total: Number(result.sale.total),
        customerId: result.sale.customerId || undefined,
        createdAt: result.sale.createdAt.toISOString(),
        updatedAt: result.sale.updatedAt.toISOString(),
        items: result.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          qty: item.qty,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          createdAt: item.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to create sale', error);
      throw error;
    }
  }

  async findAll(): Promise<SaleResponseDto[]> {
    this.logger.log('Fetching all sales');

    const sales = await this.prisma.sale.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sales.map((sale: any) => ({
      id: sale.id,
      code: sale.code,
      operator: sale.operator,
      payment: sale.payment,
      status: sale.status,
      total: Number(sale.total),
      customerId: sale.customerId || undefined,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      items: sale.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
      })),
    }));
  }

  async findOne(id: string): Promise<SaleResponseDto> {
    this.logger.log(`Fetching sale: ${id}`);

    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return {
      id: sale.id,
      code: sale.code,
      operator: sale.operator,
      payment: sale.payment,
      status: sale.status,
      total: Number(sale.total),
      customerId: sale.customerId || undefined,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      items: sale.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
