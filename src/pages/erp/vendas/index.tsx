import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileDown, Printer, RotateCcw, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { fetchSales, exportSalesToCSV, refundSale, type SaleDetail } from '@/lib/sales-api';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Filters {
  range: 'today' | 'yesterday' | '7d' | 'month' | 'custom';
  dateFrom: string;
  dateTo: string;
  q: string;
  pay: string[];
  status: string[];
  minTotal: number;
  maxTotal: number;
}

const defaultFilters: Filters = {
  range: 'month',
  dateFrom: '',
  dateTo: '',
  q: '',
  pay: [],
  status: [],
  minTotal: 0,
  maxTotal: 0,
};

export default function SalesPage() {
  const { filters, setFilters, clearFilters, activeFiltersCount } = useUrlFilters(defaultFilters);
  const [sales, setSales] = useState<SaleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load sales
  useEffect(() => {
    setIsLoading(true);
    fetchSales({
      range: filters.range,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      q: filters.q || undefined,
      pay: filters.pay.length > 0 ? filters.pay : undefined,
      status: filters.status.length > 0 ? filters.status : undefined,
      minTotal: filters.minTotal > 0 ? filters.minTotal : undefined,
      maxTotal: filters.maxTotal > 0 ? filters.maxTotal : undefined,
    })
      .then(setSales)
      .finally(() => setIsLoading(false));
  }, [filters]);

  const handleExport = () => {
    const csv = exportSalesToCSV(sales);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado', description: 'CSV gerado com sucesso' });
  };

  const handleRefund = async () => {
    if (!selectedSale) return;
    try {
      await refundSale(selectedSale.id);
      toast({ title: 'Estornado', description: `Venda ${selectedSale.id} estornada com sucesso` });
      setShowRefundDialog(false);
      setSelectedSale(null);
      // Reload
      const updated = await fetchSales(filters);
      setSales(updated);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível estornar a venda',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = (sale: SaleDetail) => {
    toast({ title: 'Imprimindo...', description: `Recibo da venda ${sale.id} (mock)` });
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Histórico completo de vendas realizadas"
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou operador..."
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filters.range} onValueChange={(v: any) => setFilters({ range: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={clearFilters} disabled={activeFiltersCount === 0}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remover todos os filtros aplicados</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
              ))
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{sale.id.slice(0, 8)}</TableCell>
                  <TableCell>{format(new Date(sale.data), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>{sale.operador}</TableCell>
                  <TableCell>{sale.itens.length}</TableCell>
                  <TableCell className="font-semibold tabular-nums">{formatCurrency(sale.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.pagamento}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'Pago' ? 'default' : 'destructive'}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedSale(sale);
                                setShowDetailDialog(true);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalhes</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => handlePrint(sale)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Imprimir recibo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {sale.status === 'Pago' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setShowRefundDialog(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Estornar venda</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
            <DialogDescription>ID: {selectedSale?.id}</DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">{format(new Date(selectedSale.data), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Operador</p>
                  <p className="font-medium">{selectedSale.operador}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">{selectedSale.pagamento}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedSale.status === 'Pago' ? 'default' : 'destructive'}>
                    {selectedSale.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Itens</h4>
                <div className="space-y-2">
                  {selectedSale.itens.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {item.qtd}x {item.nome}
                      </span>
                      <span className="font-medium tabular-nums">{formatCurrency(item.precoUnit * item.qtd)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold tabular-nums">{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fechar
            </Button>
            <Button onClick={() => selectedSale && handlePrint(selectedSale)}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar Venda</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja estornar a venda {selectedSale?.id}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRefund}>
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
