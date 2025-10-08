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