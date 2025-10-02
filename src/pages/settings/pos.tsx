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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const schema = z.object({
  scannerAutoFocus: z.boolean(),
  beepOnScan: z.boolean(),
  allowGeneralDiscount: z.boolean(),
  maxDiscountPercent: z.coerce.number().min(0).max(100),
  requireOperator: z.boolean(),
  quickFinalize: z.boolean(),
  receiptModel: z.enum(['simplified', 'detailed']),
  defaultPrinter: z.string().optional(),
  defaultCustomerId: z.string().optional(),
  requireSeller: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function PosSettings() {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      scannerAutoFocus: true,
      beepOnScan: true,
      allowGeneralDiscount: true,
      maxDiscountPercent: 20,
      requireOperator: false,
      quickFinalize: false,
      receiptModel: 'simplified',
      defaultPrinter: '',
      defaultCustomerId: '',
      requireSeller: false,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('pos_settings');
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, [form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('pos_settings', JSON.stringify(data));
      toast.success('Configurações do PDV salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      scannerAutoFocus: true,
      beepOnScan: true,
      allowGeneralDiscount: true,
      maxDiscountPercent: 20,
      requireOperator: false,
      quickFinalize: false,
      receiptModel: 'simplified',
      defaultPrinter: '',
      defaultCustomerId: '',
      requireSeller: false,
    });
    toast.success('Configurações restauradas para o padrão');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="PDV" description="Configure o comportamento do ponto de venda" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Comportamento */}
          <SettingsSection
            title="Comportamento do PDV"
            description="Defina como o sistema deve operar durante as vendas"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="scannerAutoFocus"
                render={({ field }) => (
                  <FieldGroup
                    label="Foco automático no scanner"
                    description="Mantém o cursor sempre no campo de leitura de código"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="beepOnScan"
                render={({ field }) => (
                  <FieldGroup
                    label="Som ao escanear"
                    description="Emite um beep quando um código é lido com sucesso"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="allowGeneralDiscount"
                render={({ field }) => (
                  <FieldGroup
                    label="Permitir desconto geral"
                    description="Habilita aplicação de desconto no total da venda"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              {form.watch('allowGeneralDiscount') && (
                <FormField
                  control={form.control}
                  name="maxDiscountPercent"
                  render={({ field }) => (
                    <FieldGroup label="Desconto máximo (%)">
                      <Input type="number" min={0} max={100} {...field} className="max-w-xs" />
                    </FieldGroup>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="requireOperator"
                render={({ field }) => (
                  <FieldGroup
                    label="Exigir operador logado"
                    description="Requer autenticação antes de realizar vendas"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="quickFinalize"
                render={({ field }) => (
                  <FieldGroup
                    label="Finalização rápida"
                    description="Pula confirmação quando valor pago for exatamente igual ao total"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Teclas de atalho */}
          <SettingsSection
            title="Teclas de atalho"
            description="Atalhos de teclado disponíveis no PDV"
          >
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><kbd className="px-2 py-1 bg-muted rounded">F2</kbd> Buscar produto</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">F3</kbd> Alterar quantidade</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">F4</kbd> Finalizar item</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">F6</kbd> Desconto no item</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">F8</kbd> Desconto geral</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">F10</kbd> Finalizar venda</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">DEL</kbd> Excluir item</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">ESC</kbd> Cancelar operação</div>
              </div>
            </Card>
          </SettingsSection>

          {/* Impressão */}
          <SettingsSection
            title="Impressão"
            description="Configure a impressão de recibos e cupons"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="receiptModel"
                render={({ field }) => (
                  <FieldGroup label="Modelo de recibo">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simplified">Simplificado</SelectItem>
                        <SelectItem value="detailed">Detalhado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="defaultPrinter"
                render={({ field }) => (
                  <FieldGroup
                    label="Impressora padrão"
                    description="Nome da impressora (configuração simulada)"
                  >
                    <Input placeholder="Ex: HP LaserJet" {...field} className="max-w-xs" />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Integração */}
          <SettingsSection
            title="Integração"
            description="Configure integrações e valores padrão"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="defaultCustomerId"
                render={({ field }) => (
                  <FieldGroup
                    label="Cliente padrão (vendas balcão)"
                    description="ID do cliente usado quando não especificado"
                  >
                    <Input placeholder="Ex: cliente-padrao-001" {...field} className="max-w-xs" />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="requireSeller"
                render={({ field }) => (
                  <FieldGroup
                    label="Vendedor obrigatório"
                    description="Exige a seleção de um vendedor para cada venda"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
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
