import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/erp/page-header';
import { SettingsSection } from '@/components/settings/settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Category, fetchCategories, createCategory, updateCategory, deleteCategory, CreateCategoryPayload, UpdateCategoryPayload } from '@/lib/categories-api';

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function ProductsSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
    },
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories({ active: 'true' });
      setCategories(data);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleNewCategory = () => {
    setEditingCategory(null);
    form.reset({ name: '', description: '', active: true });
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({ name: category.name, description: category.description || '', active: category.active });
    setDialogOpen(true);
  };

  const onSubmit = async (values: CategoryFormData) => {
    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, values as UpdateCategoryPayload);
        toast.success(`Categoria '${updated.name}' atualizada`);
      } else {
        const created = await createCategory(values as CreateCategoryPayload);
        toast.success(`Categoria '${created.name}' criada`);
      }
      setDialogOpen(false);
      await loadCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao salvar categoria');
    }
  };

  return (
    <div>
      <PageHeader title="Produtos" description="Configure categorias de produtos" />

      <SettingsSection
        title="Categorias"
        description="Crie e gerencie categorias de produtos"
        actions={<Button onClick={handleNewCategory}><Plus className="mr-2 h-4 w-4" /> Nova Categoria</Button>}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell>{cat.description || '-'}</TableCell>
                  <TableCell>{cat.active ? 'Ativa' : 'Inativa'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(cat)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          try {
                            await deleteCategory(cat.id);
                            toast.success('Categoria removida');
                            await loadCategories();
                          } catch (err: any) {
                            console.error(err);
                            toast.error(err?.message || 'Falha ao remover categoria');
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <div />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Higiene" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="submit">
                    {editingCategory ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </SettingsSection>
    </div>
  );
}