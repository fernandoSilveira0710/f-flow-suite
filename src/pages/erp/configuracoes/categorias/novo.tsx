import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Category, fetchCategory, createCategory, updateCategory } from '@/lib/categories-api';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve conter ao menos 2 caracteres'),
  description: z.string().optional(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NovaCategoria() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loadingItem, setLoadingItem] = useState<boolean>(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
    },
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoadingItem(true);
      try {
        const category = await fetchCategory(id);
        if (category) {
          form.reset({
            name: category.name,
            description: category.description || '',
            active: category.active,
          });
          setLoadedName(category.name);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast({ title: 'Erro ao carregar categoria', description: message, variant: 'destructive' });
      } finally {
        setLoadingItem(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (id) {
        await updateCategory(id, values as Partial<Category>);
        toast({ title: 'Categoria atualizada', description: `"${values.name}" foi atualizada.` });
      } else {
        await createCategory(values);
        toast({ title: 'Categoria criada', description: `"${values.name}" foi criada.` });
      }
      navigate('/erp/settings/categories');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: id ? 'Erro ao atualizar' : 'Erro ao criar', description: message, variant: 'destructive' });
    }
  };

  const isEditing = Boolean(id);

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        description={isEditing ? `Atualize os dados de "${loadedName ?? ''}"` : 'Cadastre uma nova categoria'}
      />

      <Card>
        <CardContent className="p-6">
          {loadingItem ? (
            <div className="text-sm text-muted-foreground">Carregando categoria...</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <Input placeholder="Ex.: Higiene" {...field} />
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
                        <Input placeholder="Opcional" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ativa</FormLabel>
                        <div className="flex items-center gap-3">
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                          <Label className="text-sm text-muted-foreground">Disponível para uso</Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Criar Categoria'}</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/erp/settings/categories')}>Cancelar</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}