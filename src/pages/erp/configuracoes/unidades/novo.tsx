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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { mockAPI, UnitOfMeasure } from '@/lib/mock-data';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve conter ao menos 2 caracteres'),
  abbreviation: z.string().min(1, 'Informe a abreviação').max(6, 'Máximo 6 caracteres'),
  type: z.enum(['weight', 'volume', 'unit', 'length']),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NovaUnidade() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loadingItem, setLoadingItem] = useState<boolean>(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      abbreviation: '',
      type: 'unit',
      active: true,
    },
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoadingItem(true);
      try {
        const unit = mockAPI.getUnitOfMeasure(id);
        if (unit) {
          form.reset({
            name: unit.name,
            abbreviation: unit.abbreviation,
            type: unit.type,
            active: unit.active,
          });
          setLoadedName(unit.name);
        }
      } finally {
        setLoadingItem(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (values: FormValues) => {
    if (id) {
      mockAPI.updateUnitOfMeasure(id, values as Partial<UnitOfMeasure>);
    } else {
      mockAPI.createUnitOfMeasure(values);
    }
    navigate('/erp/settings/units');
  };

  const isEditing = Boolean(id);

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
        description={isEditing ? `Atualize os dados de "${loadedName ?? ''}"` : 'Cadastre uma nova unidade de medida'}
      />

      <Card>
        <CardContent className="p-6">
          {loadingItem ? (
            <div className="text-sm text-muted-foreground">Carregando unidade...</div>
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
                        <Input placeholder="Ex.: Quilograma" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="abbreviation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abreviação</FormLabel>
                        <Input placeholder="Ex.: kg" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weight">Peso</SelectItem>
                            <SelectItem value="volume">Volume</SelectItem>
                            <SelectItem value="unit">Unidade</SelectItem>
                            <SelectItem value="length">Comprimento</SelectItem>
                          </SelectContent>
                        </Select>
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
                  <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Criar Unidade'}</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/erp/settings/units')}>Cancelar</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}