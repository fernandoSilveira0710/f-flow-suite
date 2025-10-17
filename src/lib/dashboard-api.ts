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
  const res = await fetch(ENDPOINTS.CLIENT_DASHBOARD_SUMMARY, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Dashboard API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}