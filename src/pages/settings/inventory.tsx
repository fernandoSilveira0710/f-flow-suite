import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/erp/page-header';
import { SettingsSection } from '@/components/settings/settings-section';
import { FieldGroup } from '@/components/settings/field-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormField } from '@/components/ui/form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const schema = z.object({
  defaultMinStock: z.coerce.number().min(0),
  blockSaleWithoutStock: z.boolean(),
  allowNegativeStock: z.boolean(),
  expiryAlertDays: z.coerce.number().min(0).max(120),
  autoDeductIngredients: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function InventorySettings() {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultMinStock: 5,
      blockSaleWithoutStock: true,
      allowNegativeStock: false,
      expiryAlertDays: 30,
      autoDeductIngredients: false,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('inventory_settings');
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, [form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('inventory_settings', JSON.stringify(data));
      toast.success('Configurações de Estoque salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      defaultMinStock: 5,
      blockSaleWithoutStock: true,
      allowNegativeStock: false,
      expiryAlertDays: 30,
      autoDeductIngredients: false,
    });
    toast.success('Configurações restauradas para o padrão');
  };

  const blockSale = form.watch('blockSaleWithoutStock');
  const allowNegative = form.watch('allowNegativeStock');

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" description="Configure regras e alertas para controle de estoque" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Níveis e bloqueios */}
          <SettingsSection
            title="Níveis e bloqueios"
            description="Defina comportamento quando estoque estiver baixo ou zerado"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="defaultMinStock"
                render={({ field }) => (
                  <FieldGroup
                    label="Estoque mínimo padrão"
                    description="Quantidade que dispara alerta de estoque baixo"
                  >
                    <Input type="number" min={0} {...field} className="max-w-xs" />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="blockSaleWithoutStock"
                render={({ field }) => (
                  <FieldGroup
                    label="Bloquear venda sem estoque"
                    description="Impede finalizar venda se produto não tiver estoque disponível"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="allowNegativeStock"
                render={({ field }) => (
                  <FieldGroup
                    label="Permitir estoque negativo"
                    description="Permite que vendas gerem saldo negativo no estoque"
                  >
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      disabled={blockSale}
                    />
                  </FieldGroup>
                )}
              />

              {allowNegative && !blockSale && (
                <Alert variant="default" className="bg-orange-500/10 border-orange-500/20">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-sm">
                    <strong>Atenção:</strong> Quando ativo, o sistema permite vendas mesmo sem estoque,
                    gerando saldo negativo. Um aviso será exibido no PDV e o evento será registrado para ajuste posterior.
                  </AlertDescription>
                </Alert>
              )}

              {blockSale && (
                <Alert variant="default" className="bg-blue-500/10 border-blue-500/20">
                  <AlertDescription className="text-sm">
                    <strong>Info:</strong> A opção "Permitir estoque negativo" está desabilitada enquanto
                    "Bloquear venda sem estoque" estiver ativa.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </SettingsSection>

          {/* Validade */}
          <SettingsSection
            title="Validade"
            description="Configure alertas para produtos próximos ao vencimento"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="expiryAlertDays"
                render={({ field }) => (
                  <FieldGroup
                    label="Alertar 'a vencer' (dias)"
                    description="Exibe alerta quando produto estiver neste prazo antes de vencer"
                  >
                    <Input type="number" min={0} max={120} {...field} className="max-w-xs" />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Baixa automática */}
          <SettingsSection
            title="Baixa automática"
            description="Configure dedução automática de insumos"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoDeductIngredients"
                render={({ field }) => (
                  <FieldGroup
                    label="Baixar insumos ao finalizar venda"
                    description="Deduz automaticamente insumos vinculados a serviços vendidos"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handleReset}>
              Restaurar padrão
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
