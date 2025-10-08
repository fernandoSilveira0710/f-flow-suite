import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { tenantId },
      orderBy: { ordem: 'asc' },
    });
  }

  async findActivePaymentMethods(tenantId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { 
        tenantId,
        ativo: true,
      },
      orderBy: { ordem: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, tenantId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    return paymentMethod;
  }

  async findByName(tenantId: string, nome: string) {
    return this.prisma.paymentMethod.findFirst({
      where: { tenantId, nome },
    });
  }

  async create(tenantId: string, createPaymentMethodDto: CreatePaymentMethodDto) {
    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        ...createPaymentMethodDto,
        tenantId,
        visivelSomenteParaRoles: createPaymentMethodDto.visibilidade?.visivelSomenteParaRoles 
          ? JSON.stringify(createPaymentMethodDto.visibilidade.visivelSomenteParaRoles)
          : null,
        // Flatten nested objects
        integracaoProvider: createPaymentMethodDto.integracao?.provider,
        referenciaExterna: createPaymentMethodDto.integracao?.referenciaExterna,
        imprimeComprovante: createPaymentMethodDto.integracao?.imprimeComprovante ?? false,
        contabilizaNoCaixa: createPaymentMethodDto.regrasCaixa?.contabilizaNoCaixa ?? true,
        permiteSangria: createPaymentMethodDto.regrasCaixa?.permiteSangria ?? false,
        valorMin: createPaymentMethodDto.restricoes?.valorMin,
        valorMax: createPaymentMethodDto.restricoes?.valorMax,
        somenteSeCaixaAberto: createPaymentMethodDto.restricoes?.somenteSeCaixaAberto ?? true,
        mostrarNoPDV: createPaymentMethodDto.visibilidade?.mostrarNoPDV ?? true,
      },
    });

    // Generate synchronization event
    await this.events.create(tenantId, 'payment-method', 'payment-method.upserted.v1', {
      id: paymentMethod.id,
      nome: paymentMethod.nome,
      tipo: paymentMethod.tipo,
      ativo: paymentMethod.ativo,
      ordem: paymentMethod.ordem,
      permiteTroco: paymentMethod.permiteTroco,
      permiteParcelas: paymentMethod.permiteParcelas,
      maxParcelas: paymentMethod.maxParcelas,
      jurosPorParcelaPct: paymentMethod.jurosPorParcelaPct,
      descontoFixoPct: paymentMethod.descontoFixoPct,
      taxaFixa: paymentMethod.taxaFixa,
      integracao: {
        provider: paymentMethod.integracaoProvider,
        referenciaExterna: paymentMethod.referenciaExterna,
        imprimeComprovante: paymentMethod.imprimeComprovante,
      },
      regrasCaixa: {
        contabilizaNoCaixa: paymentMethod.contabilizaNoCaixa,
        permiteSangria: paymentMethod.permiteSangria,
      },
      restricoes: {
        valorMin: paymentMethod.valorMin,
        valorMax: paymentMethod.valorMax,
        somenteSeCaixaAberto: paymentMethod.somenteSeCaixaAberto,
      },
      visibilidade: {
        mostrarNoPDV: paymentMethod.mostrarNoPDV,
        visivelSomenteParaRoles: paymentMethod.visivelSomenteParaRoles 
          ? JSON.parse(paymentMethod.visivelSomenteParaRoles)
          : null,
      },
      criadoEm: paymentMethod.createdAt.toISOString(),
      atualizadoEm: paymentMethod.updatedAt.toISOString(),
    });

    return paymentMethod;
  }

  async update(tenantId: string, id: string, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    const existingPaymentMethod = await this.findOne(tenantId, id);

    const paymentMethod = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...updatePaymentMethodDto,
        visivelSomenteParaRoles: updatePaymentMethodDto.visibilidade?.visivelSomenteParaRoles 
          ? JSON.stringify(updatePaymentMethodDto.visibilidade.visivelSomenteParaRoles)
          : undefined,
        // Flatten nested objects
        integracaoProvider: updatePaymentMethodDto.integracao?.provider,
        referenciaExterna: updatePaymentMethodDto.integracao?.referenciaExterna,
        imprimeComprovante: updatePaymentMethodDto.integracao?.imprimeComprovante,
        contabilizaNoCaixa: updatePaymentMethodDto.regrasCaixa?.contabilizaNoCaixa,
        permiteSangria: updatePaymentMethodDto.regrasCaixa?.permiteSangria,
        valorMin: updatePaymentMethodDto.restricoes?.valorMin,
        valorMax: updatePaymentMethodDto.restricoes?.valorMax,
        somenteSeCaixaAberto: updatePaymentMethodDto.restricoes?.somenteSeCaixaAberto,
        mostrarNoPDV: updatePaymentMethodDto.visibilidade?.mostrarNoPDV,
      },
    });

    // Generate synchronization event
    await this.events.create(tenantId, 'payment-method', 'payment-method.upserted.v1', {
      id: paymentMethod.id,
      nome: paymentMethod.nome,
      tipo: paymentMethod.tipo,
      ativo: paymentMethod.ativo,
      ordem: paymentMethod.ordem,
      permiteTroco: paymentMethod.permiteTroco,
      permiteParcelas: paymentMethod.permiteParcelas,
      maxParcelas: paymentMethod.maxParcelas,
      jurosPorParcelaPct: paymentMethod.jurosPorParcelaPct,
      descontoFixoPct: paymentMethod.descontoFixoPct,
      taxaFixa: paymentMethod.taxaFixa,
      integracao: {
        provider: paymentMethod.integracaoProvider,
        referenciaExterna: paymentMethod.referenciaExterna,
        imprimeComprovante: paymentMethod.imprimeComprovante,
      },
      regrasCaixa: {
        contabilizaNoCaixa: paymentMethod.contabilizaNoCaixa,
        permiteSangria: paymentMethod.permiteSangria,
      },
      restricoes: {
        valorMin: paymentMethod.valorMin,
        valorMax: paymentMethod.valorMax,
        somenteSeCaixaAberto: paymentMethod.somenteSeCaixaAberto,
      },
      visibilidade: {
        mostrarNoPDV: paymentMethod.mostrarNoPDV,
        visivelSomenteParaRoles: paymentMethod.visivelSomenteParaRoles 
          ? JSON.parse(paymentMethod.visivelSomenteParaRoles)
          : null,
      },
      criadoEm: paymentMethod.createdAt.toISOString(),
      atualizadoEm: paymentMethod.updatedAt.toISOString(),
    });

    return paymentMethod;
  }

  async remove(tenantId: string, id: string) {
    const paymentMethod = await this.findOne(tenantId, id);

    await this.prisma.paymentMethod.delete({
      where: { id },
    });

    // Generate synchronization event
    await this.events.create(tenantId, 'payment-method', 'payment-method.deleted.v1', {
      id: paymentMethod.id,
    });

    return { message: 'Payment method deleted successfully' };
  }

  async reorder(tenantId: string, ids: string[]) {
    // Update the ordem field for each payment method based on the provided order
    const updatePromises = ids.map((id, index) =>
      this.prisma.paymentMethod.updateMany({
        where: { id, tenantId },
        data: { ordem: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    // Generate synchronization events for all reordered payment methods
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { tenantId, id: { in: ids } },
    });

    for (const paymentMethod of paymentMethods) {
      await this.events.create(tenantId, 'payment-method', 'payment-method.upserted.v1', {
        id: paymentMethod.id,
        nome: paymentMethod.nome,
        tipo: paymentMethod.tipo,
        ativo: paymentMethod.ativo,
        ordem: paymentMethod.ordem,
        permiteTroco: paymentMethod.permiteTroco,
        permiteParcelas: paymentMethod.permiteParcelas,
        maxParcelas: paymentMethod.maxParcelas,
        jurosPorParcelaPct: paymentMethod.jurosPorParcelaPct,
        descontoFixoPct: paymentMethod.descontoFixoPct,
        taxaFixa: paymentMethod.taxaFixa,
        integracao: {
          provider: paymentMethod.integracaoProvider,
          referenciaExterna: paymentMethod.referenciaExterna,
          imprimeComprovante: paymentMethod.imprimeComprovante,
        },
        regrasCaixa: {
          contabilizaNoCaixa: paymentMethod.contabilizaNoCaixa,
          permiteSangria: paymentMethod.permiteSangria,
        },
        restricoes: {
          valorMin: paymentMethod.valorMin,
          valorMax: paymentMethod.valorMax,
          somenteSeCaixaAberto: paymentMethod.somenteSeCaixaAberto,
        },
        visibilidade: {
          mostrarNoPDV: paymentMethod.mostrarNoPDV,
          visivelSomenteParaRoles: paymentMethod.visivelSomenteParaRoles 
            ? JSON.parse(paymentMethod.visivelSomenteParaRoles)
            : null,
        },
        criadoEm: paymentMethod.createdAt.toISOString(),
        atualizadoEm: paymentMethod.updatedAt.toISOString(),
      });
    }

    return { message: 'Payment methods reordered successfully' };
  }
}