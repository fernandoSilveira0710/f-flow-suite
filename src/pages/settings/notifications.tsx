import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/erp/page-header';
import { SettingsSection } from '@/components/settings/settings-section';
import { FieldGroup } from '@/components/settings/field-group';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField } from '@/components/ui/form';
import { toast } from 'sonner';

const schema = z.object({
  onScheduleCreated: z.boolean(),
  onGroomingReady: z.boolean(),
  onSaleCompleted: z.boolean(),
  onLowStock: z.boolean(),
  onExpiringSoon: z.boolean(),
  defaultChannel: z.enum(['sms', 'whatsapp', 'email', 'push']),
});

type FormData = z.infer<typeof schema>;

export default function NotificationsSettings() {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      onScheduleCreated: true,
      onGroomingReady: true,
      onSaleCompleted: false,
      onLowStock: true,
      onExpiringSoon: true,
      defaultChannel: 'whatsapp',
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('notifications_settings');
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, [form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('notifications_settings', JSON.stringify(data));
      toast.success('Configurações de Notificações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      onScheduleCreated: true,
      onGroomingReady: true,
      onSaleCompleted: false,
      onLowStock: true,
      onExpiringSoon: true,
      defaultChannel: 'whatsapp',
    });
    toast.success('Configurações restauradas para o padrão');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notificações" description="Configure quando e como notificar usuários e clientes" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Eventos */}
          <SettingsSection
            title="Eventos de notificação"
            description="Selecione quais eventos devem disparar notificações"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="onScheduleCreated"
                render={({ field }) => (
                  <FieldGroup
                    label="Agendamento criado"
                    description="Notifica cliente quando um novo agendamento é realizado"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="onGroomingReady"
                render={({ field }) => (
                  <FieldGroup
                    label="Banho & Tosa pronto"
                    description="Notifica tutor quando pet está pronto para retirada"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="onSaleCompleted"
                render={({ field }) => (
                  <FieldGroup
                    label="Venda finalizada"
                    description="Notifica cliente após conclusão de uma venda"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="onLowStock"
                render={({ field }) => (
                  <FieldGroup
                    label="Estoque baixo"
                    description="Alerta equipe quando produto atinge estoque mínimo"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="onExpiringSoon"
                render={({ field }) => (
                  <FieldGroup
                    label="Produto a vencer"
                    description="Alerta equipe sobre produtos próximos ao vencimento"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Canal */}
          <SettingsSection
            title="Canal padrão"
            description="Selecione como as notificações serão enviadas (configuração simulada)"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="defaultChannel"
                render={({ field }) => (
                  <FieldGroup label="Canal de comunicação">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
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
