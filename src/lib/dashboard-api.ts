import { ENDPOINTS } from '@/lib/env';

export interface DashboardSummaryDto {
  vendas: {
    totalDia: number;
    totalMes: number;
    ticketMedio: number;
    quantidadeDia: number;
    quantidadeMes: number;
  };
  estoque: {
    produtosBaixoEstoque: number;
    produtosSemEstoque: number;
    valorTotalEstoque: number;
    produtosAtivos: number;
  };
  agendamentos: {
    totalDia: number;
    abertos: number;
    emAndamento: number;
    concluidos: number;
    cancelados: number;
  };
  grooming: {
    ticketsAbertos: number;
    ticketsEmAndamento: number;
    ticketsConcluidos: number;
    faturamentoDia: number;
  };
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const empty: DashboardSummaryDto = {
    vendas: {
      totalDia: 0,
      totalMes: 0,
      ticketMedio: 0,
      quantidadeDia: 0,
      quantidadeMes: 0,
    },
    estoque: {
      produtosBaixoEstoque: 0,
      produtosSemEstoque: 0,
      valorTotalEstoque: 0,
      produtosAtivos: 0,
    },
    agendamentos: {
      totalDia: 0,
      abertos: 0,
      emAndamento: 0,
      concluidos: 0,
      cancelados: 0,
    },
    grooming: {
      ticketsAbertos: 0,
      ticketsEmAndamento: 0,
      ticketsConcluidos: 0,
      faturamentoDia: 0,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(ENDPOINTS.CLIENT_DASHBOARD_SUMMARY, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!res.ok) {
      return empty;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return empty;
    }

    return (await res.json()) as DashboardSummaryDto;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return empty;
  } finally {
    clearTimeout(timer);
  }
}
