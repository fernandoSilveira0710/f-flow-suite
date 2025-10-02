import { useState, useMemo } from 'react';
import { FileDown, Plus } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getMovements, getProducts, createMovement, type StockMovement, type Product } from '@/lib/stock-api';
import { useToast } from '@/hooks/use-toast';
import { useEntitlements } from '@/hooks/use-entitlements';

type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(getMovements());
  const products = getProducts();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MovementType>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<MovementType>('ENTRADA');
  
  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [document, setDocument] = useState('');
  const [notes, setNotes] = useState('');
  const [motivo, setMotivo] = useState('');

  const { toast } = useToast();
  const { entitlements } = useEntitlements();

  const filteredMovements = useMemo(() => {
    let result = movements;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.nomeProduto.toLowerCase().includes(lower) ||
          m.sku.toLowerCase().includes(lower) ||
          m.documento?.toLowerCase().includes(lower)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((m) => m.tipo === typeFilter);
    }

    return result;
  }, [movements, search, typeFilter]);

  const openDialog = (type: MovementType) => {
    setDialogType(type);
    setDialogOpen(true);
    resetForm();
  };

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity('');
    setCost('');
    setDocument('');
    setNotes('');
    setMotivo('');
  };

  const handleCreateMovement = () => {
    if (!selectedProductId) {
      toast({ title: 'Erro', description: 'Selecione um produto', variant: 'destructive' });
      return;
    }

    const qtd = parseFloat(quantity);
    if (isNaN(qtd) || qtd <= 0) {
      toast({ title: 'Erro', description: 'Quantidade inválida', variant: 'destructive' });
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    try {
      createMovement({
        tipo: dialogType,
        produtoId: product.id,
        sku: product.sku,
        quantidade: qtd,
        custoUnit: cost ? parseFloat(cost) : undefined,
        origem: dialogType === 'ENTRADA' ? 'COMPRA' : dialogType === 'SAIDA' ? 'VENDA' : 'INVENTARIO',
        motivo: motivo || undefined,
        documento: document || undefined,
        observacao: notes || undefined,
      });

      setMovements(getMovements());
      setDialogOpen(false);
      toast({
        title: 'Sucesso',
        description: `${dialogType === 'ENTRADA' ? 'Entrada' : dialogType === 'SAIDA' ? 'Saída' : 'Ajuste'} registrado`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao registrar movimento',
        variant: 'destructive',
      });
    }
  };

  const getTypeBadge = (type: MovementType) => {
    if (type === 'ENTRADA') return <Badge className="bg-green-500">Entrada</Badge>;
    if (type === 'SAIDA') return <Badge className="bg-red-500">Saída</Badge>;
    return <Badge variant="secondary">Ajuste</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações de Estoque"
        description="Histórico de entradas, saídas e ajustes"
      />

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar por produto, SKU ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ENTRADA">Entrada</SelectItem>
              <SelectItem value="SAIDA">Saída</SelectItem>
              <SelectItem value="AJUSTE">Ajuste</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openDialog('ENTRADA')}>
            <Plus className="mr-2 h-4 w-4" />
            Entrada
          </Button>
          <Button variant="outline" onClick={() => openDialog('SAIDA')}>
            <Plus className="mr-2 h-4 w-4" />
            Saída
          </Button>
          <Button variant="outline" onClick={() => openDialog('AJUSTE')}>
            Ajuste
          </Button>
        </div>
      </div>

      {/* Movements table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Custo Unit.</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhuma movimentação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {new Date(movement.data).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell>{getTypeBadge(movement.tipo)}</TableCell>
                  <TableCell className="font-medium">{movement.nomeProduto}</TableCell>
                  <TableCell>{movement.sku}</TableCell>
                  <TableCell>
                    {movement.tipo === 'ENTRADA' && '+'}
                    {movement.tipo === 'SAIDA' && '-'}
                    {movement.quantidade}
                  </TableCell>
                  <TableCell>
                    {movement.custoUnit ? `R$ ${movement.custoUnit.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{movement.documento || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{movement.observacao || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'ENTRADA' && 'Nova Entrada'}
              {dialogType === 'SAIDA' && 'Nova Saída'}
              {dialogType === 'AJUSTE' && 'Novo Ajuste'}
            </DialogTitle>
            <DialogDescription>Registrar movimentação de estoque</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="product">Produto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">
                {dialogType === 'AJUSTE' ? 'Novo saldo' : 'Quantidade'}
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>

            {dialogType === 'ENTRADA' && (
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

            {dialogType === 'SAIDA' && (
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMovement}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
