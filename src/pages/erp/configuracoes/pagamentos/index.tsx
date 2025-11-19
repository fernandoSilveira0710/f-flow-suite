import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getPaymentMethods, importPresets, PaymentMethod, deletePaymentMethod } from '@/lib/payments-api';
import { Plus, RefreshCw, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { toast } from '@/hooks/use-toast';

export default function PaymentsIndex() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);

  const {
    data: methods,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: getPaymentMethods,
  });

  const handleImportPresets = async () => {
    setImporting(true);
    try {
      await importPresets();
      await refetch();
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    try {
      await deletePaymentMethod(method.id);
      setMethodToDelete(null);
      await refetch();
      toast({ title: 'Método excluído', description: `"${method.nome}" foi removido com sucesso.` });
    } catch (error) {
      console.error('Erro ao excluir método de pagamento:', error);
      const message = error instanceof Error ? error.message : String(error);
      let serverMsg: string | undefined;
      try {
        const jsonStart = message.lastIndexOf('{');
        if (jsonStart !== -1) {
          const jsonText = message.substring(jsonStart);
          const parsed = JSON.parse(jsonText);
          serverMsg = parsed?.message || parsed?.error;
        }
      } catch {}
      toast({
        title: 'Erro ao excluir método',
        description: serverMsg || 'Ocorreu um erro inesperado ao excluir o método de pagamento.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Métodos de Pagamento"
        description="Gerencie os meios de pagamento disponíveis no PDV"
      />

      <div className="flex items-center gap-3 mb-4">
        <Button onClick={() => navigate('/erp/settings/payments/new')}> 
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6 text-sm text-muted-foreground">Carregando métodos de pagamento...</div>
          )}

          {isError && (
            <div className="p-6 text-sm text-destructive">
              Erro ao carregar métodos. Tente atualizar.
            </div>
          )}

          {!isLoading && !isError && (methods?.length ?? 0) === 0 && (
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum método de pagamento cadastrado.
              </p>
              <div className="flex items-center gap-3">
                <Button onClick={() => navigate('/erp/settings/payments/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeiro método
                </Button>
                <Button variant="secondary" onClick={handleImportPresets} disabled={importing}>
                  Importar presets (PIX, Débito, Crédito, Dinheiro)
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && (methods?.length ?? 0) > 0 && (
            <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Regras</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods!.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="w-[80px]">{m.ordem}</TableCell>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell>
                      <Badge variant={m.ativo ? 'default' : 'secondary'}>
                        {m.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {m.permiteTroco && <span>Troco</span>}
                        {m.permiteParcelas && <span>Parcelas até {m.maxParcelas ?? 1}x</span>}
                        {(m.descontoFixoPct ?? 0) > 0 && <span>Desconto {m.descontoFixoPct}%</span>}
                        {(m.jurosPorParcelaPct ?? 0) > 0 && <span>Juros {m.jurosPorParcelaPct}%/parcela</span>}
                        {(m.taxaFixa ?? 0) > 0 && <span>Taxa R$ {m.taxaFixa?.toFixed(2)}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/erp/settings/payments/${m.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setMethodToDelete(m)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!methodToDelete} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Método de Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{methodToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => methodToDelete && handleDelete(methodToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}