import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  Download,
  DollarSign,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
  importPresets,
  getPaymentMethodBadgeColor,
  PaymentMethod,
} from '@/lib/payments-api';
import { cn } from '@/lib/utils';

export default function PagamentosSettings() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const data = await getPaymentMethods();
      setMethods(data);
    } catch (error) {
      toast.error('Erro ao carregar métodos de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, ativo: boolean) => {
    try {
      await updatePaymentMethod(id, { ativo });
      toast.success(ativo ? 'Método ativado' : 'Método desativado');
      loadMethods();
    } catch (error) {
      toast.error('Erro ao atualizar método');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deletePaymentMethod(deleteId);
      toast.success('Método removido com sucesso');
      setDeleteId(null);
      loadMethods();
    } catch (error) {
      toast.error('Erro ao remover método');
    }
  };

  const handleImportPresets = async () => {
    try {
      await importPresets();
      toast.success('Presets importados com sucesso');
      loadMethods();
    } catch (error) {
      toast.error('Erro ao importar presets');
    }
  };

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      CASH: 'Dinheiro',
      DEBIT: 'Débito',
      CREDIT: 'Crédito',
      PIX: 'PIX',
      VOUCHER: 'Vale',
      OTHER: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Meios de Pagamento" description="Carregando..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Meios de Pagamento"
        description={`${methods.length} métodos configurados`}
        actionLabel="Novo Método"
        actionIcon={Plus}
        onAction={() => navigate('/erp/configuracoes/pagamentos/novo')}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImportPresets}>
            <Download className="h-4 w-4 mr-2" />
            Importar Presets
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead>Características</TableHead>
                <TableHead>PDV</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum método cadastrado. Importe os presets ou crie um novo.
                  </TableCell>
                </TableRow>
              ) : (
                methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{method.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Ordem: {method.ordem}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border', getPaymentMethodBadgeColor(method.tipo))}>
                        {getTypeLabel(method.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={method.ativo}
                        onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {method.permiteTroco && (
                          <Badge variant="secondary" className="text-xs">
                            Troco
                          </Badge>
                        )}
                        {method.permiteParcelas && (
                          <Badge variant="secondary" className="text-xs">
                            Até {method.maxParcelas}x
                          </Badge>
                        )}
                        {method.descontoFixoPct && method.descontoFixoPct > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Percent className="h-3 w-3" />
                            -{method.descontoFixoPct}%
                          </Badge>
                        )}
                        {method.jurosPorParcelaPct && method.jurosPorParcelaPct > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Percent className="h-3 w-3" />
                            +{method.jurosPorParcelaPct}%
                          </Badge>
                        )}
                        {method.taxaFixa && method.taxaFixa > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {method.taxaFixa.toFixed(2)}
                          </Badge>
                        )}
                        {method.integracao?.provider && method.integracao.provider !== 'nenhum' && (
                          <Badge variant="secondary" className="text-xs">
                            {method.integracao.provider}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={method.visibilidade?.mostrarNoPDV !== false ? 'default' : 'secondary'}>
                        {method.visibilidade?.mostrarNoPDV !== false ? 'Visível' : 'Oculto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/erp/configuracoes/pagamentos/${method.id}/editar`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(method.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este método de pagamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
