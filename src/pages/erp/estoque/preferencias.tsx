import { useState } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { getStockPrefs, saveStockPrefs, type StockPrefs } from '@/lib/stock-api';
import { useToast } from '@/hooks/use-toast';

const prefsSchema = z.object({
  estoqueMinimoPadrao: z.number().min(0, 'Valor deve ser maior ou igual a zero').optional(),
  bloquearVendaSemEstoque: z.boolean(),
  habilitarCodigoBarras: z.boolean(),
  considerarValidade: z.boolean(),
});

type PrefsFormData = z.infer<typeof prefsSchema>;

export default function StockSettingsPage() {
  const [prefs, setPrefs] = useState<StockPrefs>(getStockPrefs());
  const { toast } = useToast();

  const form = useForm<PrefsFormData>({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      estoqueMinimoPadrao: prefs.estoqueMinimoPadrao || 10,
      bloquearVendaSemEstoque: prefs.bloquearVendaSemEstoque ?? true,
      habilitarCodigoBarras: prefs.habilitarCodigoBarras ?? true,
      considerarValidade: prefs.considerarValidade ?? true,
    },
  });

  const onSubmit = (data: PrefsFormData) => {
    try {
      saveStockPrefs(data);
      setPrefs(data);
      toast({ title: 'Preferências salvas com sucesso' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar preferências',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferências de Estoque"
        description="Configure o comportamento do módulo de estoque"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Defina os parâmetros padrão do estoque</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="estoqueMinimoPadrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mínimo Padrão</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor padrão quando não especificado no produto
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bloquearVendaSemEstoque"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Bloquear Venda Sem Estoque</FormLabel>
                      <FormDescription>
                        Impede a finalização de vendas quando o produto está sem estoque
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="habilitarCodigoBarras"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Habilitar Código de Barras</FormLabel>
                      <FormDescription>
                        Permite buscar produtos por código de barras (EAN/UPC)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="considerarValidade"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Considerar Validade</FormLabel>
                      <FormDescription>
                        Ativa alertas e controles relacionados à data de validade dos produtos
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
