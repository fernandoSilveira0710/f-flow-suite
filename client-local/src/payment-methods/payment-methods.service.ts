import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreatePaymentMethodDto, PaymentMethodResponseDto, UpdatePaymentMethodDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async create(tenantId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    let pm: any;
    try {
      pm = await this.prisma.paymentMethod.create({
        data: {
          tenantId,
          name: dto.nome,
          type: dto.tipo,
          active: dto.ativo ?? true,
          ordem: dto.ordem ?? 0,
          permiteTroco: dto.permiteTroco ?? false,
          permiteParcelas: dto.permiteParcelas ?? false,
          maxParcelas: dto.permiteParcelas ? dto.maxParcelas : undefined,
          jurosPorParcelaPct: dto.permiteParcelas ? dto.jurosPorParcelaPct : undefined,
          descontoFixoPct: dto.descontoFixoPct,
          taxaFixa: dto.taxaFixa,
          integrationSettings: dto.integracao ? JSON.stringify(dto.integracao) : undefined,
          valorMin: dto.restricoes?.valorMin,
          valorMax: dto.restricoes?.valorMax,
          mostrarNoPDV: dto.visibilidade?.mostrarNoPDV ?? true,
          somenteSeCaixaAberto: dto.restricoes?.somenteSeCaixaAberto ?? true,
          contabilizaNoCaixa: dto.regrasCaixa?.contabilizaNoCaixa ?? true,
          permiteSangria: dto.regrasCaixa?.permiteSangria ?? false,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const fields = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : String(error?.meta?.target ?? 'unique field');
        this.logger.warn(`Unique constraint violation on payment method create '${dto.nome}': ${fields}`);
        throw new ConflictException(`Já existe um meio de pagamento com nome '${dto.nome}'`);
      }
      this.logger.error(`Unexpected error creating payment method '${dto.nome}'`, error);
      throw error;
    }

    await this.generatePaymentMethodEvent(pm, 'paymentmethod.upserted.v1');

    return this.mapToResponseDto(pm);
  }

  async findAll(tenantId: string): Promise<PaymentMethodResponseDto[]> {
    const items = await this.prisma.paymentMethod.findMany({
      where: { tenantId },
      orderBy: [{ ordem: 'asc' }, { name: 'asc' }],
    });
    return items.map(this.mapToResponseDto);
  }

  async findActive(tenantId: string): Promise<PaymentMethodResponseDto[]> {
    const items = await this.prisma.paymentMethod.findMany({
      where: { tenantId, active: true },
      orderBy: [{ ordem: 'asc' }, { name: 'asc' }],
    });
    return items.map(this.mapToResponseDto);
  }

  async findOne(tenantId: string, id: string): Promise<PaymentMethodResponseDto> {
    const pm = await this.prisma.paymentMethod.findFirst({
      where: { id, tenantId },
    });
    if (!pm) {
      throw new NotFoundException(`PaymentMethod with ID ${id} not found`);
    }
    return this.mapToResponseDto(pm);
  }

  async update(tenantId: string, id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    const existing = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException(`PaymentMethod with ID ${id} not found`);

    let updated: any;
    try {
      updated = await this.prisma.paymentMethod.update({
        where: { id },
        data: {
          ...(dto.nome !== undefined && { name: dto.nome }),
          ...(dto.tipo !== undefined && { type: dto.tipo }),
          ...(dto.ativo !== undefined && { active: dto.ativo }),
          ...(dto.ordem !== undefined && { ordem: dto.ordem }),
          ...(dto.permiteTroco !== undefined && { permiteTroco: dto.permiteTroco }),
          ...(dto.permiteParcelas !== undefined && { permiteParcelas: dto.permiteParcelas }),
          ...(dto.maxParcelas !== undefined && { maxParcelas: dto.maxParcelas }),
          ...(dto.jurosPorParcelaPct !== undefined && { jurosPorParcelaPct: dto.jurosPorParcelaPct }),
          ...(dto.descontoFixoPct !== undefined && { descontoFixoPct: dto.descontoFixoPct }),
          ...(dto.taxaFixa !== undefined && { taxaFixa: dto.taxaFixa }),
          ...(dto.integracao !== undefined && { integrationSettings: dto.integracao ? JSON.stringify(dto.integracao) : null }),
          ...(dto.restricoes?.valorMin !== undefined && { valorMin: dto.restricoes?.valorMin }),
          ...(dto.restricoes?.valorMax !== undefined && { valorMax: dto.restricoes?.valorMax }),
          ...(dto.visibilidade?.mostrarNoPDV !== undefined && { mostrarNoPDV: dto.visibilidade?.mostrarNoPDV }),
          ...(dto.restricoes?.somenteSeCaixaAberto !== undefined && { somenteSeCaixaAberto: dto.restricoes?.somenteSeCaixaAberto }),
          ...(dto.regrasCaixa?.contabilizaNoCaixa !== undefined && { contabilizaNoCaixa: dto.regrasCaixa?.contabilizaNoCaixa }),
          ...(dto.regrasCaixa?.permiteSangria !== undefined && { permiteSangria: dto.regrasCaixa?.permiteSangria }),
          ...(dto.visibilidade?.visivelSomenteParaRoles !== undefined && {
            visivelSomenteParaRoles: dto.visibilidade?.visivelSomenteParaRoles ? JSON.stringify(dto.visibilidade.visivelSomenteParaRoles) : null,
          }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const fields = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : String(error?.meta?.target ?? 'unique field');
        this.logger.warn(`Unique constraint violation on payment method update ${id}: ${fields}`);
        throw new ConflictException(`Já existe um meio de pagamento com valor duplicado em: ${fields}`);
      }
      this.logger.error(`Unexpected error updating payment method ${id}`, error);
      throw error;
    }

    await this.generatePaymentMethodEvent(updated, 'paymentmethod.upserted.v1');

    return this.mapToResponseDto(updated);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const existing = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException(`PaymentMethod with ID ${id} not found`);

    await this.prisma.paymentMethod.delete({ where: { id } });

    const payload = { id, deletedAt: new Date().toISOString() };
    const validation = this.eventValidator.validateEvent('paymentmethod.deleted.v1', payload);
    if (!validation.valid) {
      this.logger.error('Event validation failed', { errors: validation.errors });
      throw new Error(`Event validation failed: ${validation.errors?.join(', ')}`);
    }

    await this.prisma.outboxEvent.create({
      data: {
        id: uuidv4(),
        eventType: 'paymentmethod.deleted.v1',
        payload: JSON.stringify(payload),
        createdAt: new Date(),
      },
    });
  }

  async reorder(tenantId: string, ids: string[]): Promise<void> {
    if (!Array.isArray(ids) || ids.length === 0) return;
    await this.prisma.$transaction(
      ids.map((id, idx) =>
        this.prisma.paymentMethod.update({
          where: { id },
          data: { ordem: idx + 1 },
        })
      )
    );
  }

  private mapToResponseDto = (pm: any): PaymentMethodResponseDto => {
    let integracao: any = undefined;
    try {
      integracao = pm.integrationSettings ? JSON.parse(pm.integrationSettings) : undefined;
    } catch {
      integracao = undefined;
    }

    let roles: string[] | null = null;
    try {
      roles = pm.visivelSomenteParaRoles ? JSON.parse(pm.visivelSomenteParaRoles) : null;
    } catch {
      roles = null;
    }

    return {
      id: pm.id,
      nome: pm.name,
      tipo: pm.type,
      ativo: pm.active,
      ordem: pm.ordem ?? 0,
      permiteTroco: pm.permiteTroco ?? false,
      permiteParcelas: pm.permiteParcelas ?? false,
      maxParcelas: pm.maxParcelas ?? null,
      jurosPorParcelaPct: pm.jurosPorParcelaPct ?? null,
      descontoFixoPct: pm.descontoFixoPct ?? null,
      taxaFixa: pm.taxaFixa ?? null,
      integracao,
      regrasCaixa: {
        contabilizaNoCaixa: pm.contabilizaNoCaixa ?? true,
        permiteSangria: pm.permiteSangria ?? false,
      },
      restricoes: {
        valorMin: pm.valorMin ?? null,
        valorMax: pm.valorMax ?? null,
        somenteSeCaixaAberto: pm.somenteSeCaixaAberto ?? true,
      },
      visibilidade: {
        mostrarNoPDV: pm.mostrarNoPDV ?? true,
        visivelSomenteParaRoles: roles,
      },
      createdAt: pm.createdAt,
      updatedAt: pm.updatedAt,
    };
  };

  private async generatePaymentMethodEvent(pm: any, eventType: 'paymentmethod.upserted.v1'): Promise<void> {
    const safeParse = (json?: string) => {
      try {
        return json ? JSON.parse(json) : undefined;
      } catch {
        return undefined;
      }
    };
    const safeParseArray = (json?: string | null) => {
      try {
        return json ? JSON.parse(json) : null;
      } catch {
        return null;
      }
    };
    const toIso = (d: any) => d?.toISOString?.() ?? d;

    const payload = {
      id: pm.id,
      nome: pm.name,
      tipo: pm.type,
      ativo: pm.active,
      ordem: pm.ordem ?? 0,
      permiteTroco: pm.permiteTroco ?? false,
      permiteParcelas: pm.permiteParcelas ?? false,
      maxParcelas: pm.maxParcelas ?? null,
      jurosPorParcelaPct: pm.jurosPorParcelaPct ?? null,
      descontoFixoPct: pm.descontoFixoPct ?? null,
      taxaFixa: pm.taxaFixa ?? null,
      integracao: safeParse(pm.integrationSettings),
      regrasCaixa: {
        contabilizaNoCaixa: pm.contabilizaNoCaixa ?? true,
        permiteSangria: pm.permiteSangria ?? false,
      },
      restricoes: {
        valorMin: pm.valorMin ?? null,
        valorMax: pm.valorMax ?? null,
        somenteSeCaixaAberto: pm.somenteSeCaixaAberto ?? true,
      },
      visibilidade: {
        mostrarNoPDV: pm.mostrarNoPDV ?? true,
        visivelSomenteParaRoles: safeParseArray(pm.visivelSomenteParaRoles),
      },
      createdAt: toIso(pm.createdAt),
      updatedAt: pm.updatedAt ? toIso(pm.updatedAt) : undefined,
    };

    const validation = this.eventValidator.validateEvent(eventType, payload);
    if (!validation.valid) {
      this.logger.warn('PaymentMethod event validation failed', { errors: validation.errors });
      return;
    }

    try {
      await this.prisma.outboxEvent.create({
        data: {
          id: uuidv4(),
          eventType,
          payload: JSON.stringify(payload),
          createdAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error('Failed to persist paymentmethod outbox event', err);
    }
  }
}