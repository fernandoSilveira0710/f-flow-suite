import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // Métricas de vendas
    const [
      vendasDia,
      vendasMes,
      totalVendasDia,
      totalVendasMes,
    ] = await Promise.all([
      // Quantidade de vendas hoje
      this.prisma.sale.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      // Quantidade de vendas no mês
      this.prisma.sale.count({
        where: {
          createdAt: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth,
          },
        },
      }),
      // Total de vendas hoje
      this.prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Total de vendas no mês
      this.prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth,
          },
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    // Métricas de estoque
    const [
      produtosAtivos,
      produtosBaixoEstoque,
      produtosSemEstoque,
      valorTotalEstoque,
    ] = await Promise.all([
      // Produtos ativos
      this.prisma.product.count({
        where: { active: true },
      }),
      // Produtos com estoque baixo (menos de 10 unidades)
      this.prisma.product.count({
        where: {
          active: true,
          stockQty: {
            gt: 0,
            lt: 10,
          },
        },
      }),
      // Produtos sem estoque
      this.prisma.product.count({
        where: {
          active: true,
          stockQty: 0,
        },
      }),
      // Valor total do estoque
      this.prisma.product.aggregate({
        where: { active: true },
        _sum: {
          stockQty: true,
        },
      }),
    ]);

    // Métricas de agendamentos
    const [
      agendamentosDia,
      agendamentosAbertos,
      agendamentosEmAndamento,
      agendamentosConcluidos,
      agendamentosCancelados,
    ] = await Promise.all([
      // Agendamentos de hoje
      this.prisma.appointment.count({
        where: {
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      // Agendamentos com status "scheduled"
      this.prisma.appointment.count({
        where: {
          status: 'scheduled',
        },
      }),
      // Agendamentos em andamento
      this.prisma.appointment.count({
        where: {
          status: 'in_progress',
        },
      }),
      // Agendamentos concluídos
      this.prisma.appointment.count({
        where: {
          status: 'completed',
        },
      }),
      // Agendamentos cancelados
      this.prisma.appointment.count({
        where: {
          status: 'cancelled',
        },
      }),
    ]);

    // Métricas de grooming
    const [
      groomingAbertos,
      groomingEmAndamento,
      groomingConcluidos,
      faturamentoGroomingDia,
    ] = await Promise.all([
      // Tickets de grooming abertos
      this.prisma.groomingTicket.count({
        where: {
          status: 'aberto',
        },
      }),
      // Tickets em andamento
      this.prisma.groomingTicket.count({
        where: {
          status: 'em_andamento',
        },
      }),
      // Tickets concluídos
      this.prisma.groomingTicket.count({
        where: {
          status: 'concluido',
        },
      }),
      // Faturamento de grooming hoje
      this.prisma.groomingTicket.aggregate({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: 'concluido',
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    const ticketMedio = vendasDia > 0 
      ? Number(totalVendasDia._sum.total || 0) / vendasDia 
      : 0;

    return {
      vendas: {
        totalDia: Number(totalVendasDia._sum.total || 0),
        totalMes: Number(totalVendasMes._sum.total || 0),
        ticketMedio,
        quantidadeDia: vendasDia,
        quantidadeMes: vendasMes,
      },
      estoque: {
        produtosBaixoEstoque,
        produtosSemEstoque,
        valorTotalEstoque: Number(valorTotalEstoque._sum.stockQty || 0),
        produtosAtivos,
      },
      agendamentos: {
        totalDia: agendamentosDia,
        abertos: agendamentosAbertos,
        emAndamento: agendamentosEmAndamento,
        concluidos: agendamentosConcluidos,
        cancelados: agendamentosCancelados,
      },
      grooming: {
        ticketsAbertos: groomingAbertos,
        ticketsEmAndamento: groomingEmAndamento,
        ticketsConcluidos: groomingConcluidos,
        faturamentoDia: Number(faturamentoGroomingDia._sum.total || 0),
      },
    };
  }
}