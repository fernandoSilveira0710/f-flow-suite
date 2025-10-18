import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Copy, Power, Trash2, GripVertical } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getPaymentMethods, updatePaymentMethod, deletePaymentMethod, type PaymentMethod } from '@/lib/payments-api';

export default function PaymentsIndex() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await getPaymentMethods();
      setMethods(data);
    } catch (error) {
      toast.error('Erro ao carregar métodos de pagamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleToggleActive = async (id: string, ativo: boolean) => {
    try {
      await updatePaymentMethod(id, { ativo });
      setMethods(methods.map(m => m.id === id ? { ...m, ativo } : m));
      toast.success(ativo ? 'Método ativado' : 'Método desativado');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePaymentMethod(deleteId);
      setMethods(methods.filter(m => m.id !== deleteId));
      toast.success('Método excluído');
      setDeleteId(null);
    } catch (error) {
      toast.error('Erro ao excluir método');
    }
  };

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      debit: 'Débito',
      credit: 'Crédito',
      pix: 'PIX',
      voucher: 'Vale',
      custom: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Pagamento</h1>
          <p className="text-muted-foreground mt-1">Gerencie as formas de pagamento disponíveis no PDV</p>
        </div>
        <Button onClick={() => navigate('/erp/settings/payments/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo método
        </Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : methods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Nenhum método de pagamento cadastrado</p>
            <Button onClick={() => navigate('/erp/settings/payments/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeiro método
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Parcelas</TableHead>
                <TableHead className="text-center">Taxa %</TableHead>
                <TableHead className="text-center">No PDV</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell className="font-medium">{method.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(method.tipo)}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {method.permiteParcelas ? `Até ${method.maxParcelas}x` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {method.jurosPorParcelaPct ? `${method.jurosPorParcelaPct}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {method.visibilidade?.mostrarNoPDV ? (
                      <Badge variant="default" className="text-xs">Sim</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={method.ativo}
                      onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/erp/settings/payments/${method.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // Duplicate functionality placeholder
                          toast.info('Função de duplicar em desenvolvimento');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(method.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir método de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O método será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
