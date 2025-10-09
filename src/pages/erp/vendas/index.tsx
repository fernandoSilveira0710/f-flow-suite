import { useState, useEffect } from 'react';
import { Search, FileDown, Printer, RotateCcw, ExternalLink, X, Filter as FilterIcon } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { fetchSales, exportSalesToCSV, refundSale, type SaleDetail } from '@/lib/sales-api';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Filters {
  range: 'today' | 'yesterday' | '7d' | 'month' | 'custom';
  dateFrom: string;
  dateTo: string;
  q: string;
  pay: string[];
  status: string[];
}

const defaultFilters: Filters = {
  range: 'month',
  dateFrom: '',
  dateTo: '',
  q: '',
  pay: [],
  status: [],
};

const paymentOptions = [
  { value: 'PIX', label: 'PIX', color: 'bg-green-500' },
  { value: 'DEBIT', label: 'Débito', color: 'bg-blue-500' },
  { value: 'CREDIT', label: 'Crédito', color: 'bg-purple-500' },
  { value: 'CASH', label: 'Dinheiro', color: 'bg-gray-500' },
  { value: 'OTHER', label: 'Outros', color: 'bg-amber-500' },
];

const statusOptions = [
  { value: 'Pago', label: 'Pago' },
  { value: 'Cancelado', label: 'Cancelado' },
];

export default function SalesPage() {
  const { filters, setFilters, clearFilters, activeFiltersCount } = useUrlFilters(defaultFilters);
  const [sales, setSales] = useState<SaleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const { toast } = useToast();

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
      toast({ title: 'Estornado', description: `Venda ${selectedSale.id.slice(0, 8)} estornada com sucesso` });
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
    toast({ title: 'Imprimindo...', description: `Recibo da venda ${sale.id.slice(0, 8)} (mock)` });
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getPaymentBadgeColor = (payment: string) => {
    const upper = payment.toUpperCase();
    if (upper.includes('PIX')) return 'bg-green-500 text-white';
    if (upper.includes('DÉBIT') || upper.includes('DEBIT')) return 'bg-blue-500 text-white';
    if (upper.includes('CRÉDIT') || upper.includes('CREDIT')) return 'bg-purple-500 text-white';
    if (upper.includes('DINHEIRO') || upper.includes('CASH')) return 'bg-gray-500 text-white';
    return 'bg-amber-500 text-white';
  };

  const togglePaymentFilter = (value: string) => {
    const newPay = filters.pay.includes(value)
      ? filters.pay.filter(p => p !== value)
      : [...filters.pay, value];
    setFilters({ pay: newPay });
  };

  const toggleStatusFilter = (value: string) => {
    const newStatus = filters.status.includes(value)
      ? filters.status.filter(s => s !== value)
      : [...filters.status, value];
    setFilters({ status: newStatus });
  };

  const removeFilter = (type: 'pay' | 'status', value: string) => {
    if (type === 'pay') {
      setFilters({ pay: filters.pay.filter(p => p !== value) });
    } else {
      setFilters({ status: filters.status.filter(s => s !== value) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Histórico completo de vendas realizadas"
      />

      {/* Filters */}
      <div className="space-y-4">
        {/* Search and Range */}
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

        {/* Filter buttons and chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <FilterIcon className="mr-2 h-4 w-4" />
                Pagamento
                {filters.pay.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filters.pay.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Forma de Pagamento</h4>
                {paymentOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pay-${option.value}`}
                      checked={filters.pay.includes(option.value)}
                      onCheckedChange={() => togglePaymentFilter(option.value)}
                    />
                    <Label htmlFor={`pay-${option.value}`} className="text-sm cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <FilterIcon className="mr-2 h-4 w-4" />
                Status
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filters.status.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Status da Venda</h4>
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status.includes(option.value)}
                      onCheckedChange={() => toggleStatusFilter(option.value)}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter chips */}
          {filters.pay.map((pay) => (
            <Badge key={pay} variant="secondary" className="gap-1">
              {paymentOptions.find(p => p.value === pay)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('pay', pay)}
              />
            </Badge>
          ))}

          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('status', status)}
              />
            </Badge>
          ))}

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          )}

          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{sales.length} vendas encontradas</span>
          {sales.length > 0 && (
            <span>Total: {formatCurrency(sales.reduce((sum, s) => sum + s.total, 0))}</span>
          )}
        </div>
      )}

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
                  <TableCell>{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>{sale.operator}</TableCell>
                  <TableCell>{sale.items?.length || 0}</TableCell>
                  <TableCell className="font-semibold tabular-nums">{formatCurrency(sale.total)}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getPaymentBadgeColor(sale.paymentMethod))}>
                      {sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'destructive'} className={sale.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}>
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
                  <p className="font-medium">{format(new Date(selectedSale.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Operador</p>
                  <p className="font-medium">{selectedSale.operator}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Forma de Pagamento</p>
                  <Badge className={cn("mt-1", getPaymentBadgeColor(selectedSale.paymentMethod))}>
                    {selectedSale.paymentMethod}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedSale.status === 'completed' ? 'default' : 'destructive'} className="mt-1">
                    {selectedSale.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Itens</h4>
                <div className="space-y-2">
                  {selectedSale.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {item.qty}x Produto {item.productId}
                      </span>
                      <span className="font-medium tabular-nums">{formatCurrency(item.unitPrice * item.qty)}</span>
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
              Tem certeza que deseja estornar a venda {selectedSale?.id.slice(0, 8)}?
              Esta ação não pode ser desfeita.
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
