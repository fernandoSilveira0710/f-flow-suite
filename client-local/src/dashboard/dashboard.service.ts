import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    // replace date-fns helpers with native implementations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

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
          status: { not: 'refunded' },
        },
      }),
      // Quantidade de vendas no mês
      this.prisma.sale.count({
        where: {
          createdAt: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth,
          },
          status: { not: 'refunded' },
        },
      }),
      // Total de vendas hoje
      this.prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: { not: 'refunded' },
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
          status: { not: 'refunded' },
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    // Estoque e produtos
    const [
      produtosAtivos,
      baixoEstoque,
      semEstoque,
    ] = await Promise.all([
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.product.count({ where: { stockQty: { gt: 0, lt: 5 }, active: true } }),
      this.prisma.product.count({ where: { stockQty: 0, active: true } }),
    ]);

    // Agenda de hoje
    const [
      agendamentosHoje,
      agendados,
      emAndamento,
      concluidos,
      cancelados,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      // Agendamentos com status "scheduled"
      this.prisma.appointment.count({ where: { status: 'scheduled' } }),
      // Em andamento
      this.prisma.appointment.count({ where: { status: 'in_progress' } }),
      // Concluídos
      this.prisma.appointment.count({ where: { status: 'completed' } }),
      // Cancelados
      this.prisma.appointment.count({ where: { status: 'cancelled' } }),
    ]);

    // Grooming
    const [
      groomingAbertos,
      groomingEmAndamento,
      groomingConcluidos,
      faturamentoGroomingDia,
    ] = await Promise.all([
      this.prisma.groomingTicket.count({ where: { status: 'aberto' } }),
      this.prisma.groomingTicket.count({ where: { status: 'em_andamento' } }),
      this.prisma.groomingTicket.count({ where: { status: 'concluido' } }),
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

    // Série de faturamento diário do mês
    const daysInMonth = endOfCurrentMonth.getDate();
    const monthRevenueSeries: Array<{ day: string; total: number }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), day, 23, 59, 59, 999);
      const daily = await this.prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: { not: 'refunded' },
        },
        _sum: { total: true },
      });
      monthRevenueSeries.push({ day: String(day).padStart(2, '0'), total: Number(daily._sum.total || 0) });
    }

    return {
      vendas: {
        quantidadeDia: vendasDia,
        quantidadeMes: vendasMes,
        totalDia: Number(totalVendasDia._sum.total || 0),
        totalMes: Number(totalVendasMes._sum.total || 0),
        ticketMedio: vendasDia > 0 ? Number(totalVendasDia._sum.total || 0) / vendasDia : 0,
      },
      estoque: {
        produtosAtivos: produtosAtivos,
        produtosBaixoEstoque: baixoEstoque,
        produtosSemEstoque: semEstoque,
        valorTotalEstoque: Number((await this.prisma.product.aggregate({
          where: { active: true },
          _sum: { stockQty: true },
        }))._sum.stockQty || 0),
      },
      agendamentos: {
        totalDia: agendamentosHoje,
        abertos: agendados,
        emAndamento: emAndamento,
        concluidos: concluidos,
        cancelados: cancelados,
      },
      grooming: {
        ticketsAbertos: groomingAbertos,
        ticketsEmAndamento: groomingEmAndamento,
        ticketsConcluidos: groomingConcluidos,
        faturamentoDia: Number(faturamentoGroomingDia._sum.total || 0),
      },
      // monthRevenueSeries,
    };
  }
}