import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto';

// Tipos auxiliares para armazenar campos adicionais no integrationSettings
interface IntegrationSettings {
  ordem?: number;
  permiteTroco?: boolean;
  permiteParcelas?: boolean;
  maxParcelas?: number;
  integracao?: {
    provider?: 'nenhum' | 'maquininha' | 'gateway';
    referenciaExterna?: string;
    imprimeComprovante?: boolean;
  };
  regrasCaixa?: {
    contabilizaNoCaixa?: boolean;
    permiteSangria?: boolean;
  };
  restricoes?: {
    somenteSeCaixaAberto?: boolean;
  };
  visibilidade?: {
    mostrarNoPDV?: boolean;
  };
}

function parseSettings(settings: string | null): IntegrationSettings {
  if (!settings) return {};
  try {
    return JSON.parse(settings) as IntegrationSettings;
  } catch {
    return {};
  }
}

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  private mapToApi(pm: any) {
    const settings = parseSettings(pm.integrationSettings ?? null);

    return {
      // IDs e datas
      id: pm.id,
      criadoEm: pm.createdAt?.toISOString?.() ?? pm.createdAt,
      atualizadoEm: pm.updatedAt?.toISOString?.() ?? pm.updatedAt,

      // Campos esperados pelo frontend (português)
      nome: pm.name,
      tipo: pm.type,
      ativo: pm.active,
      ordem: settings.ordem ?? 0,

      // Regras e taxas
      permiteTroco: settings.permiteTroco ?? false,
      permiteParcelas: settings.permiteParcelas ?? false,
      maxParcelas: settings.maxParcelas,
      jurosPorParcelaPct: pm.jurosPorParcelaPct ?? undefined,
      descontoFixoPct: pm.descontoFixoPct ?? undefined,
      taxaFixa: pm.taxaFixa ?? undefined,

      // Integração
      integracao: settings.integracao ?? undefined,

      // Regras de caixa
      regrasCaixa: settings.regrasCaixa
        ? {
            contabilizaNoCaixa: settings.regrasCaixa.contabilizaNoCaixa ?? true,
            permiteSangria: settings.regrasCaixa.permiteSangria ?? false,
          }
        : { contabilizaNoCaixa: true, permiteSangria: false },

      // Restrições
      restricoes: {
        valorMin: pm.valorMin ?? undefined,
        valorMax: pm.valorMax ?? undefined,
        somenteSeCaixaAberto: settings.restricoes?.somenteSeCaixaAberto ?? true,
      },

      // Visibilidade
      visibilidade: {
        mostrarNoPDV: settings.visibilidade?.mostrarNoPDV ?? true,
        visivelSomenteParaRoles: pm.visivelSomenteParaRoles
          ? (typeof pm.visivelSomenteParaRoles === 'string'
              ? JSON.parse(pm.visivelSomenteParaRoles)
              : pm.visivelSomenteParaRoles)
          : null,
      },
    };
  }

  async findAll(tenantId: string) {
    const rows = await this.prisma.paymentMethod.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapToApi(r));
  }

  async findActivePaymentMethods(tenantId: string) {
    const rows = await this.prisma.paymentMethod.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.mapToApi(r));
  }

  async findOne(tenantId: string, id: string) {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, tenantId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    return this.mapToApi(paymentMethod);
  }

  async findByName(tenantId: string, nome: string) {
    const row = await this.prisma.paymentMethod.findFirst({
      where: { tenantId, name: nome },
    });
    return row ? this.mapToApi(row) : null;
  }

  async create(tenantId: string, createPaymentMethodDto: CreatePaymentMethodDto) {
    const settings: IntegrationSettings = {
      ordem: createPaymentMethodDto.ordem,
      permiteTroco: createPaymentMethodDto.permiteTroco,
      permiteParcelas: createPaymentMethodDto.permiteParcelas,
      maxParcelas: createPaymentMethodDto.maxParcelas,
      integracao: createPaymentMethodDto.integracao,
      regrasCaixa: createPaymentMethodDto.regrasCaixa,
      restricoes: { somenteSeCaixaAberto: createPaymentMethodDto.restricoes?.somenteSeCaixaAberto },
      visibilidade: { mostrarNoPDV: createPaymentMethodDto.visibilidade?.mostrarNoPDV },
    };

    const payload = {
      tenantId,
      name: createPaymentMethodDto.nome,
      type: createPaymentMethodDto.tipo,
      active: createPaymentMethodDto.ativo,
      jurosPorParcelaPct: createPaymentMethodDto.jurosPorParcelaPct ?? null,
      descontoFixoPct: createPaymentMethodDto.descontoFixoPct ?? null,
      taxaFixa: createPaymentMethodDto.taxaFixa ?? null,
      valorMin: createPaymentMethodDto.restricoes?.valorMin ?? null,
      valorMax: createPaymentMethodDto.restricoes?.valorMax ?? null,
      visivelSomenteParaRoles: createPaymentMethodDto.visibilidade?.visivelSomenteParaRoles
        ? JSON.stringify(createPaymentMethodDto.visibilidade.visivelSomenteParaRoles)
        : null,
      integrationSettings: JSON.stringify(settings),
    } as const;

    // Verificar duplicidade por (tenantId, name) antes de criar
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { tenantId, name: createPaymentMethodDto.nome },
    });
    if (existing) {
      throw new ConflictException(`Já existe um método de pagamento com nome '${createPaymentMethodDto.nome}'`);
    }

    const created = await this.prisma.paymentMethod.create({ data: payload as any });

    await this.events.createEvent(tenantId, {
      eventType: 'payment-method.upserted.v1',
      entityType: 'payment-method',
      entityId: created.id,
      data: this.mapToApi(created),
    });
    return this.mapToApi(created);
  }

  async update(tenantId: string, id: string, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    const existing = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Payment method not found');

    const currentSettings = parseSettings(existing.integrationSettings ?? null);

    const nextSettings: IntegrationSettings = {
      ordem: updatePaymentMethodDto.ordem ?? currentSettings.ordem,
      permiteTroco: updatePaymentMethodDto.permiteTroco ?? currentSettings.permiteTroco,
      permiteParcelas: updatePaymentMethodDto.permiteParcelas ?? currentSettings.permiteParcelas,
      maxParcelas: updatePaymentMethodDto.maxParcelas ?? currentSettings.maxParcelas,
      integracao: updatePaymentMethodDto.integracao ?? currentSettings.integracao,
      regrasCaixa: updatePaymentMethodDto.regrasCaixa ?? currentSettings.regrasCaixa,
      restricoes: {
        somenteSeCaixaAberto:
          updatePaymentMethodDto.restricoes?.somenteSeCaixaAberto ?? currentSettings.restricoes?.somenteSeCaixaAberto,
      },
      visibilidade: {
        mostrarNoPDV: updatePaymentMethodDto.visibilidade?.mostrarNoPDV ?? currentSettings.visibilidade?.mostrarNoPDV,
      },
    };

    const payload: any = {
      name: updatePaymentMethodDto.nome ?? undefined,
      type: updatePaymentMethodDto.tipo ?? undefined,
      active: updatePaymentMethodDto.ativo ?? undefined,
      jurosPorParcelaPct: updatePaymentMethodDto.jurosPorParcelaPct ?? undefined,
      descontoFixoPct: updatePaymentMethodDto.descontoFixoPct ?? undefined,
      taxaFixa: updatePaymentMethodDto.taxaFixa ?? undefined,
      valorMin: updatePaymentMethodDto.restricoes?.valorMin ?? undefined,
      valorMax: updatePaymentMethodDto.restricoes?.valorMax ?? undefined,
      visivelSomenteParaRoles: updatePaymentMethodDto.visibilidade?.visivelSomenteParaRoles
        ? JSON.stringify(updatePaymentMethodDto.visibilidade.visivelSomenteParaRoles)
        : (updatePaymentMethodDto.visibilidade ? null : undefined),
      integrationSettings: JSON.stringify(nextSettings),
    };

    const updated = await this.prisma.paymentMethod.update({ where: { id }, data: payload });

    await this.events.createEvent(tenantId, {
      eventType: 'payment-method.upserted.v1',
      entityType: 'payment-method',
      entityId: updated.id,
      data: this.mapToApi(updated),
    });

    return this.mapToApi(updated);
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Payment method not found');

    await this.prisma.paymentMethod.delete({ where: { id } });

    await this.events.createEvent(tenantId, {
      eventType: 'payment-method.deleted.v1',
      entityType: 'payment-method',
      entityId: existing.id,
      data: { id: existing.id },
    });
    
    return { message: 'Payment method deleted successfully' };
  }

  async reorder(tenantId: string, ids: string[]) {
    // Sem coluna "ordem" no schema, persistimos a ordem dentro do integrationSettings
    const methods = await this.prisma.paymentMethod.findMany({ where: { tenantId, id: { in: ids } } });

    const methodsById = new Map(methods.map((m) => [m.id, m]));

    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      const row = methodsById.get(id);
      if (!row) continue;
      const settings = parseSettings(row.integrationSettings ?? null);
      settings.ordem = index + 1;
      await this.prisma.paymentMethod.update({
        where: { id },
        data: { integrationSettings: JSON.stringify(settings) },
      });
    }

    // Emitimos eventos de upsert para sincronização
    const updated = await this.prisma.paymentMethod.findMany({ where: { tenantId, id: { in: ids } } });
    for (const pm of updated) {
      await this.events.createEvent(tenantId, {
        eventType: 'payment-method.upserted.v1',
        entityType: 'payment-method',
        entityId: pm.id,
        data: this.mapToApi(pm),
      });
    }

    return { message: 'Payment methods reordered successfully' };
  }
}