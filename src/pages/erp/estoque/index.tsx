import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, FileDown, Printer, X } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getProducts as getMockProducts, getStockPrefs, adjustStock, getStockMovements, type StockMovement } from '@/lib/stock-api';
import { getProducts as fetchProductsApi, updateProduct, type ProductResponse } from '@/lib/products-api';
import { useToast } from '@/hooks/use-toast';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useNavigate } from 'react-router-dom';

type MovementDialogType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | null;

interface StockFilters {
  filter: 'all' | 'below-min' | 'out-of-stock' | 'expire-soon';
  days: number;
  q: string;
  category: string[];
}

const defaultFilters: StockFilters = {
  filter: 'all',
  days: 30,
  q: '',
  category: [],
};

// Tipo local para a UI da página de Estoque
interface UIProduct {
  id: string;
  nome: string;
  sku: string;
  preco?: number;
  estoque: number;
  estoqueAtual: number;
  estoqueMinimo?: number;
  categoria?: string;
  barcode?: string;
  unidade?: string;
  validade?: string;
}

export default function StockPositionPage() {
  const [products, setProducts] = useState<UIProduct[]>([]);
  const { filters, setFilters, clearFilters, activeFiltersCount } = useUrlFilters(defaultFilters);
  const [movementDialog, setMovementDialog] = useState<MovementDialogType>(null);
  const [selectedProduct, setSelectedProduct] = useState<UIProduct | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<UIProduct | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsMovements, setDetailsMovements] = useState<StockMovement[]>([]);
  const [recentMovements, setRecentMovements] = useState<Record<string, StockMovement[]>>({});
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [document, setDocument] = useState('');
  const [notes, setNotes] = useState('');
  const [motivo, setMotivo] = useState('');
  const [minStock, setMinStock] = useState('');
  const [alterarSaldo, setAlterarSaldo] = useState(false);
  const [alterarMinimo, setAlterarMinimo] = useState(false);

  const { toast } = useToast();
  const { entitlements } = useEntitlements();
  const navigate = useNavigate();
  const prefs = getStockPrefs();

  // Carregar produtos da API real com fallback para mock
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const list = await fetchProductsApi();
        const mapped: UIProduct[] = list.map((p: ProductResponse) => ({
          id: p.id,
          nome: p.name,
          sku: p.sku || '',
          preco: p.price,
          estoque: p.currentStock,
          estoqueAtual: p.currentStock,
          estoqueMinimo: p.minStock ?? prefs.estoqueMinimoPadrao ?? undefined,
          categoria: p.category,
          barcode: p.barcode,
          unidade: p.unit || 'un',
          validade: p.expiryDate ?? undefined,
        }));
        setProducts(mapped);
      } catch (error) {
        console.warn('API de produtos indisponível, usando dados mock:', error);
        const mockList = getMockProducts();
        setProducts(mockList.map(p => ({
          id: p.id,
          nome: p.nome,
          sku: p.sku,
          preco: p.preco,
          estoque: p.estoque,
          estoqueAtual: p.estoqueAtual,
          estoqueMinimo: p.estoqueMinimo,
          categoria: p.categoria,
          barcode: p.barcode,
          unidade: p.unidade,
          validade: p.validade,
        })));
      }
    };
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (filters.q) {
      const lower = filters.q.toLowerCase();
      result = result.filter(
        (p) =>
          p.nome.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower) ||
          p.barcode?.toLowerCase().includes(lower)
      );
    }

    // Category filter
    if (filters.category.length > 0) {
      result = result.filter((p) => p.categoria && filters.category.includes(p.categoria));
    }

    // Status filter
    if (filters.filter === 'out-of-stock') {
      result = result.filter((p) => p.estoqueAtual <= 0);
    } else if (filters.filter === 'below-min') {
      result = result.filter(
        (p) => p.estoqueAtual > 0 && p.estoqueAtual < (p.estoqueMinimo || prefs.estoqueMinimoPadrao || 0)
      );
    } else if (filters.filter === 'expire-soon') {
      result = result.filter((p) => {
        if (!p.validade) return false;
        const validadeDate = new Date(p.validade);
        const diffDays = Math.ceil((validadeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= (filters.days || 30);
      });
    }

    return result;
  }, [products, filters, prefs]);

  const openMovementDialog = (type: MovementDialogType, product: UIProduct) => {
    setSelectedProduct(product);
    setMovementDialog(type);
    setQuantity('');
    setCost('');
    setDocument('');
    setNotes('');
    setMotivo('');
    setMinStock(product.estoqueMinimo?.toString() || '');
    setAlterarSaldo(false);
    setAlterarMinimo(false);
  };

  const openDetailsDialog = async (product: UIProduct) => {
    setDetailsProduct(product);
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const movements = await getStockMovements(product.id);
      const recent = recentMovements[product.id] || [];
      const merged = [...recent, ...movements];
      setDetailsMovements(merged);
    } catch (error) {
      const recent = recentMovements[product.id] || [];
      setDetailsMovements(recent);
      console.warn('Falha ao carregar histórico de movimentos:', error);
      toast({ title: 'Aviso', description: 'Não foi possível carregar o histórico. Tente novamente mais tarde.' });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Sanitização e formatação de custo com 2 casas decimais
  const sanitizeCurrencyInput = (input: string) => {
    if (input === '') return '';
    let v = input.replace(',', '.');
    // Mantém apenas dígitos e um ponto
    v = v.replace(/[^\d.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) {
      v = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
    }
    const [intPart, decPart] = v.split('.');
    if (decPart !== undefined) {
      return `${intPart}${decPart ? '.' + decPart.slice(0, 2) : ''}`;
    }
    return intPart;
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeCurrencyInput(raw);
    setCost(sanitized);
  };

  const handleCostBlur = () => {
    if (!cost) return;
    const num = parseFloat(cost);
    if (!isNaN(num) && num >= 0) {
      setCost(num.toFixed(2));
    } else {
      setCost('');
    }
  };

  const refreshProducts = async () => {
    try {
      const list = await fetchProductsApi();
      const mapped: UIProduct[] = list.map((p: ProductResponse) => ({
        id: p.id,
        nome: p.name,
        sku: p.sku || '',
        preco: p.price,
        estoque: p.currentStock,
        estoqueAtual: p.currentStock,
        estoqueMinimo: p.minStock ?? prefs.estoqueMinimoPadrao ?? undefined,
        categoria: p.category,
        barcode: p.barcode,
        unidade: p.unit || 'un',
        validade: p.expiryDate ?? undefined,
      }));
      setProducts(mapped);
    } catch (error) {
      console.warn('Falha ao atualizar via API, fallback para mock:', error);
      const mockList = getMockProducts();
      setProducts(mockList.map(p => ({
        id: p.id,
        nome: p.nome,
        sku: p.sku,
        preco: p.preco,
        estoque: p.estoque,
        estoqueAtual: p.estoqueAtual,
        estoqueMinimo: p.estoqueMinimo,
        categoria: p.categoria,
        barcode: p.barcode,
        unidade: p.unidade,
        validade: p.validade,
      })));
    }
  };

  const handleMovement = async () => {
    if (!selectedProduct || !movementDialog) return;

    // Para ajuste, verificar se pelo menos uma opção está habilitada
    if (movementDialog === 'AJUSTE') {
      if (!alterarSaldo && !alterarMinimo) {
        toast({ title: 'Erro', description: 'Selecione pelo menos uma opção para alterar', variant: 'destructive' });
        return;
      }
      
      if (alterarSaldo) {
        const qtd = parseFloat(quantity);
        if (isNaN(qtd) || qtd < 0) {
          toast({ title: 'Erro', description: 'Novo saldo inválido', variant: 'destructive' });
          return;
        }
      }
      
      if (alterarMinimo) {
        const minStockValue = parseFloat(minStock);
        if (isNaN(minStockValue) || minStockValue < 0) {
          toast({ title: 'Erro', description: 'Estoque mínimo inválido', variant: 'destructive' });
          return;
        }
      }
    } else {
      const qtd = parseFloat(quantity);
      if (isNaN(qtd) || qtd <= 0) {
        toast({ title: 'Erro', description: 'Quantidade inválida', variant: 'destructive' });
        return;
      }
    }

    try {
      // Determinar delta e razão para ajuste de estoque
      let delta = 0;
      let reason = 'Inventário';
      if (movementDialog === 'ENTRADA') {
        delta = parseFloat(quantity);
        reason = 'Compra';
      } else if (movementDialog === 'SAIDA') {
        delta = -parseFloat(quantity);
        reason = motivo || 'Venda';
      } else if (movementDialog === 'AJUSTE' && alterarSaldo) {
        const novoSaldo = parseFloat(quantity);
        delta = novoSaldo - selectedProduct.estoqueAtual;
        reason = 'Inventário';
      }

      const ops: Promise<any>[] = [];
      // Executar ajuste de estoque se aplicável
      if (movementDialog !== 'AJUSTE' || alterarSaldo) {
        ops.push(
          adjustStock({
            productId: selectedProduct.id,
            delta,
            reason,
            notes: notes || undefined,
            document: document || undefined,
            unitCost:
              movementDialog === 'ENTRADA' && cost
                ? parseFloat(cost)
                : undefined,
          })
        );
      }
      // Atualizar estoque mínimo quando solicitado
      if (movementDialog === 'AJUSTE' && alterarMinimo) {
        const minValue = parseFloat(minStock);
        ops.push(updateProduct(selectedProduct.id, { minStock: minValue }));
      }

      await Promise.all(ops);

      await refreshProducts();
      // Registrar movimento recente localmente para refletir imediatamente no histórico
      if (movementDialog !== 'AJUSTE' || alterarSaldo) {
        const tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' = movementDialog === 'ENTRADA' ? 'ENTRADA' : movementDialog === 'SAIDA' ? 'SAIDA' : 'AJUSTE';
        const quantidade = Math.abs(delta || 0);
        const origem = tipo === 'ENTRADA' ? 'COMPRA' : tipo === 'SAIDA' ? 'VENDA' : 'INVENTARIO';
        const nowIso = new Date().toISOString();
        const localMovement: StockMovement = {
          id: `local-${Date.now()}`,
          tipo,
          produtoId: selectedProduct.id,
          produtoNome: selectedProduct.nome,
          sku: selectedProduct.sku || '',
          quantidade,
          custoUnit: movementDialog === 'ENTRADA' && cost ? parseFloat(cost) : undefined,
          valorTotal: movementDialog === 'ENTRADA' && cost ? (parseFloat(cost) * quantidade) : undefined,
          origem,
          motivo: reason,
          documento: undefined,
          data: nowIso,
          usuario: 'Você',
          observacao: notes || undefined,
        };
        setRecentMovements((prev) => ({
          ...prev,
          [selectedProduct.id]: [localMovement, ...(prev[selectedProduct.id] || [])],
        }));
      }
      setMovementDialog(null);
      setAlterarSaldo(false);
      setAlterarMinimo(false);
      setQuantity('');
      setMinStock('');
      toast({
        title: 'Sucesso',
        description: `${movementDialog === 'ENTRADA' ? 'Entrada' : movementDialog === 'SAIDA' ? 'Saída' : 'Ajuste'} registrado com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao registrar movimento',
        variant: 'destructive',
      });
    }
  };

  const getStockBadge = (product: UIProduct) => {
    if (product.estoqueAtual <= 0) {
      return <Badge variant="destructive">Ruptura</Badge>;
    }
    if (product.estoqueAtual < (product.estoqueMinimo || prefs.estoqueMinimoPadrao || 0)) {
      return <Badge className="bg-amber-500">Abaixo do mínimo</Badge>;
    }
    return <Badge className="bg-green-500">Normal</Badge>;
  };

  const getTypeBadge = (type: 'ENTRADA' | 'SAIDA' | 'AJUSTE') => {
    if (type === 'ENTRADA') return <Badge className="bg-green-500">Entrada</Badge>;
    if (type === 'SAIDA') return <Badge className="bg-red-500">Saída</Badge>;
    return <Badge variant="secondary">Ajuste</Badge>;
  };

  const handleExportCSV = () => {
    if (!entitlements.reports) {
      toast({
        title: 'Recurso bloqueado',
        description: 'Exportação disponível apenas no plano Pro ou Max',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Exportando...', description: 'CSV gerado com sucesso (mock)' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Posição de Estoque"
        description="Controle de produtos e movimentações"
      />

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU ou código de barras... (Ctrl+K)"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select value={filters.filter} onValueChange={(v: any) => setFilters({ filter: v })}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="out-of-stock">Sem estoque</SelectItem>
            <SelectItem value="below-min">Abaixo do mínimo</SelectItem>
            <SelectItem value="expire-soon">Validade próxima ({filters.days}d)</SelectItem>
          </SelectContent>
        </Select>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover filtros aplicados</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="outline" onClick={handleExportCSV}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Products table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Estoque Atual</TableHead>
              <TableHead>Mínimo</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.unidade}</TableCell>
                  <TableCell>{product.estoqueAtual}</TableCell>
                  <TableCell>{product.estoqueMinimo || prefs.estoqueMinimoPadrao || '-'}</TableCell>
                  <TableCell>
                    {product.validade ? new Date(product.validade).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>{getStockBadge(product)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMovementDialog('ENTRADA', product)}
                      >
                        Entrada
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMovementDialog('SAIDA', product)}
                      >
                        Saída
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMovementDialog('AJUSTE', product)}
                      >
                        Ajuste
                      </Button>
                      <Badge
                        variant="outline"
                        className="cursor-pointer px-3 py-1 inline-flex items-center"
                        onClick={() => openDetailsDialog(product)}
                        title="Ver histórico de entradas, saídas e ajustes"
                      >
                        Detalhes
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate('/erp/estoque/etiquetas')}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Estoque</DialogTitle>
            <DialogDescription>
              {detailsProduct?.nome} ({detailsProduct?.sku})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {detailsLoading ? (
              <div className="text-sm text-muted-foreground">Carregando histórico...</div>
            ) : detailsMovements.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum movimento encontrado para este produto.</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Motivo/Obs.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsMovements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.data).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{getTypeBadge(m.tipo)}</TableCell>
                        <TableCell>{m.quantidade}</TableCell>
                        <TableCell>{m.documento || '-'}</TableCell>
                        <TableCell className="max-w-[280px] truncate" title={m.observacao || m.motivo || ''}>
                          {m.motivo || m.observacao || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={!!movementDialog} onOpenChange={() => setMovementDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementDialog === 'ENTRADA' && 'Entrada de Estoque'}
              {movementDialog === 'SAIDA' && 'Saída de Estoque'}
              {movementDialog === 'AJUSTE' && 'Ajuste de Estoque'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.nome} ({selectedProduct?.sku})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Exibir estoque atual */}
            {selectedProduct && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estoque Atual:</span>
                  <span className="text-lg font-bold text-primary">
                    {selectedProduct.estoqueAtual} {selectedProduct.unidade}
                  </span>
                </div>
                {movementDialog === 'AJUSTE' && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-sm font-medium">Estoque Mínimo Atual:</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {selectedProduct.estoqueMinimo || prefs.estoqueMinimoPadrao || 0} {selectedProduct.unidade}
                    </span>
                  </div>
                )}
                {movementDialog === 'ENTRADA' && quantity && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Novo estoque:</span>
                    <span className="text-sm font-medium text-green-600">
                      {selectedProduct.estoqueAtual + (parseFloat(quantity) || 0)} {selectedProduct.unidade}
                    </span>
                  </div>
                )}
                {movementDialog === 'SAIDA' && quantity && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Novo estoque:</span>
                    <span className="text-sm font-medium text-red-600">
                      {selectedProduct.estoqueAtual - (parseFloat(quantity) || 0)} {selectedProduct.unidade}
                    </span>
                  </div>
                )}
              </div>
            )}

            {movementDialog === 'AJUSTE' ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="alterarSaldo"
                      checked={alterarSaldo}
                      onCheckedChange={(checked) => setAlterarSaldo(checked as boolean)}
                    />
                    <Label htmlFor="alterarSaldo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Alterar saldo do estoque
                    </Label>
                  </div>
                  {alterarSaldo && (
                    <div>
                      <Label htmlFor="quantity">Novo saldo</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="alterarMinimo"
                      checked={alterarMinimo}
                      onCheckedChange={(checked) => setAlterarMinimo(checked as boolean)}
                    />
                    <Label htmlFor="alterarMinimo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Alterar estoque mínimo
                    </Label>
                  </div>
                  {alterarMinimo && (
                    <div>
                      <Label htmlFor="minStock">Novo estoque mínimo</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            )}

            {movementDialog === 'ENTRADA' && (
              <div>
                <Label htmlFor="cost">Custo unitário (opcional)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min={0}
                  value={cost}
                  onChange={handleCostChange}
                  onBlur={handleCostBlur}
                  placeholder="0.00"
                />
              </div>
            )}

            {movementDialog === 'SAIDA' && (
              <div>
                <Label htmlFor="motivo">Motivo</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Venda">Venda</SelectItem>
                    <SelectItem value="Perda">Perda</SelectItem>
                    <SelectItem value="Consumo">Consumo Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Campo de documento removido conforme solicitado */}

            <div>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleMovement}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
