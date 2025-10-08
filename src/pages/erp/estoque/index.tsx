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
import { getProducts, createMovement, getStockPrefs, type Product } from '@/lib/stock-api';
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

export default function StockPositionPage() {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const { filters, setFilters, clearFilters, activeFiltersCount } = useUrlFilters(defaultFilters);
  const [movementDialog, setMovementDialog] = useState<MovementDialogType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
        if (!prefs.considerarValidade || !p.validade) return false;
        const validadeDate = new Date(p.validade);
        const diffDays = Math.ceil((validadeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= (filters.days || 30);
      });
    }

    return result;
  }, [products, filters, prefs]);

  const openMovementDialog = (type: MovementDialogType, product: Product) => {
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

  const handleMovement = () => {
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
      createMovement({
        tipo: movementDialog,
        produtoId: selectedProduct.id,
        sku: selectedProduct.sku,
        quantidade: movementDialog === 'AJUSTE' && alterarSaldo ? parseFloat(quantity) : movementDialog !== 'AJUSTE' ? parseFloat(quantity) : undefined,
        custoUnit: cost ? parseFloat(cost) : undefined,
        origem: movementDialog === 'ENTRADA' ? 'COMPRA' : movementDialog === 'SAIDA' ? 'VENDA' : 'INVENTARIO',
        motivo: motivo || undefined,
        documento: document || undefined,
        observacao: notes || undefined,
        estoqueMinimo: movementDialog === 'AJUSTE' && alterarMinimo ? parseFloat(minStock) : undefined,
      });

      setProducts(getProducts());
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

  const getStockBadge = (product: Product) => {
    if (product.estoqueAtual <= 0) {
      return <Badge variant="destructive">Ruptura</Badge>;
    }
    if (product.estoqueAtual < (product.estoqueMinimo || prefs.estoqueMinimoPadrao || 0)) {
      return <Badge className="bg-amber-500">Abaixo do mínimo</Badge>;
    }
    return <Badge className="bg-green-500">Normal</Badge>;
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
              {prefs.considerarValidade && <TableHead>Validade</TableHead>}
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
                  {prefs.considerarValidade && (
                    <TableCell>
                      {product.validade ? new Date(product.validade).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                  )}
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
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
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

            <div>
              <Label htmlFor="document">Documento (opcional)</Label>
              <Input
                id="document"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Nº do documento"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
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
