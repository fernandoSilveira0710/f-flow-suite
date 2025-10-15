import { useState } from 'react';
import { Plus, Search, MoreVertical, Trash2, Edit } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  getServiceCategories, 
  deleteServiceCategory, 
  createServiceCategory, 
  updateServiceCategory,
  type ServiceCategoryConfig,
  type ServiceCategory 
} from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function GroomingCategoriesIndex() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<ServiceCategoryConfig | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [categories, setCategories] = useState(() => getServiceCategories());

  // Form state for add/edit
  const [formValue, setFormValue] = useState<ServiceCategory>('BANHO');
  const [formLabel, setFormLabel] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  const filteredCategories = categories.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.value.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    const deleted = deleteServiceCategory(id);
    if (deleted) {
      setCategories(getServiceCategories());
      toast.success('Categoria excluída com sucesso');
    }
    setDeleteId(null);
  };

  const handleAdd = () => {
    if (!formLabel.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    createServiceCategory({
      value: formValue,
      label: formLabel.trim(),
      ativo: formAtivo,
    });

    setCategories(getServiceCategories());
    toast.success('Categoria criada com sucesso');
    setShowAddDialog(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!editCategory || !formLabel.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    updateServiceCategory(editCategory.id, {
      value: formValue,
      label: formLabel.trim(),
      ativo: formAtivo,
    });

    setCategories(getServiceCategories());
    toast.success('Categoria atualizada com sucesso');
    setEditCategory(null);
    resetForm();
  };

  const resetForm = () => {
    setFormValue('BANHO');
    setFormLabel('');
    setFormAtivo(true);
  };

  const openEditDialog = (category: ServiceCategoryConfig) => {
    setEditCategory(category);
    setFormValue(category.value);
    setFormLabel(category.label);
    setFormAtivo(category.ativo);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Serviços"
        description="Gerencie as categorias dos serviços de banho & tosa"
      />

      <div className="rounded-2xl border bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar categorias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria encontrada"
            description="Não há categorias cadastradas ou que correspondam à sua busca."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.label}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {category.value}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.ativo ? 'default' : 'secondary'}>
                      {category.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {category.criadoEm ? new Date(category.criadoEm).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(category.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria de serviço
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-label">Nome da Categoria</Label>
              <Input
                id="add-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Ex: Banho Premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-value">Valor (Código)</Label>
              <Input
                id="add-value"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value as ServiceCategory)}
                placeholder="Ex: BANHO_PREMIUM"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="add-ativo"
                checked={formAtivo}
                onCheckedChange={setFormAtivo}
              />
              <Label htmlFor="add-ativo">Categoria ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Criar Categoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Modifique os dados da categoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">Nome da Categoria</Label>
              <Input
                id="edit-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Ex: Banho Premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Valor (Código)</Label>
              <Input
                id="edit-value"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value as ServiceCategory)}
                placeholder="Ex: BANHO_PREMIUM"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-ativo"
                checked={formAtivo}
                onCheckedChange={setFormAtivo}
              />
              <Label htmlFor="edit-ativo">Categoria ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategory(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
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