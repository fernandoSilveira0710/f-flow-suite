import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Category, fetchCategories, deleteCategory } from '@/lib/categories-api';

export default function CategoriesIndex() {
  const navigate = useNavigate();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { data: categories, isLoading, isError, refetch } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => fetchCategories({ active: 'all' }),
  });

  const handleDelete = async (category: Category) => {
    try {
      await deleteCategory(category.id);
      setCategoryToDelete(null);
      await refetch();
      toast({ title: 'Categoria excluída', description: `"${category.name}" foi removida com sucesso.` });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: 'Erro ao excluir categoria', description: message || 'Ocorreu um erro ao excluir a categoria.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Categorias" description="Gerencie as categorias usadas nos produtos" />

      <div className="flex items-center gap-3 mb-4">
        <Button onClick={() => navigate('/erp/settings/categories/new')}>
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
            <div className="p-6 text-sm text-muted-foreground">Carregando categorias...</div>
          )}

          {isError && (
            <div className="p-6 text-sm text-destructive">Erro ao carregar categorias. Tente atualizar.</div>
          )}

          {!isLoading && !isError && (categories?.length ?? 0) === 0 && (
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Nenhuma categoria cadastrada.</p>
              <Button onClick={() => navigate('/erp/settings/categories/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </Button>
            </div>
          )}

          {!isLoading && !isError && (categories?.length ?? 0) > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories!.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={c.active ? 'default' : 'secondary'}>
                          {c.active ? 'Ativa' : 'Inativa'}
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
                              <Link to={`/erp/settings/categories/${c.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCategoryToDelete(c)} className="text-destructive">
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

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{categoryToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => categoryToDelete && handleDelete(categoryToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}