import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, RefreshCw, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { mockAPI, UnitOfMeasure } from '@/lib/mock-data';

export default function UnitsIndex() {
  const navigate = useNavigate();
  const [unitToDelete, setUnitToDelete] = useState<UnitOfMeasure | null>(null);

  const { data: units, isLoading, isError, refetch } = useQuery<UnitOfMeasure[]>({
    queryKey: ['units-of-measure'],
    queryFn: async () => mockAPI.getAllUnitsOfMeasure(),
  });

  const handleDelete = async (unit: UnitOfMeasure) => {
    try {
      const ok = mockAPI.deleteUnitOfMeasure(unit.id);
      if (!ok) throw new Error('Falha ao excluir unidade.');
      setUnitToDelete(null);
      await refetch();
      toast({ title: 'Unidade excluída', description: `"${unit.name}" foi removida com sucesso.` });
    } catch (error) {
      console.error('Erro ao excluir unidade de medida:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erro ao excluir unidade',
        description: message || 'Ocorreu um erro inesperado ao excluir a unidade de medida.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Unidades de Medida"
        description="Gerencie unidades como kg, L, un, m, etc."
      />

      <div className="flex items-center gap-3 mb-4">
        <Button onClick={() => navigate('/erp/settings/units/new')}>
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
            <div className="p-6 text-sm text-muted-foreground">Carregando unidades de medida...</div>
          )}

          {isError && (
            <div className="p-6 text-sm text-destructive">Erro ao carregar unidades. Tente atualizar.</div>
          )}

          {!isLoading && !isError && (units?.length ?? 0) === 0 && (
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Nenhuma unidade cadastrada.</p>
              <Button onClick={() => navigate('/erp/settings/units/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira unidade
              </Button>
            </div>
          )}

          {!isLoading && !isError && (units?.length ?? 0) > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Abreviação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units!.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.abbreviation}</TableCell>
                      <TableCell className="capitalize">{u.type}</TableCell>
                      <TableCell>
                        <Badge variant={u.active ? 'default' : 'secondary'}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </Badge>
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
                              <Link to={`/erp/settings/units/${u.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setUnitToDelete(u)} className="text-destructive">
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

      <AlertDialog open={!!unitToDelete} onOpenChange={() => setUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Unidade de Medida</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{unitToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => unitToDelete && handleDelete(unitToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}