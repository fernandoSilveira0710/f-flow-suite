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
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { toast } from 'sonner';

const schema = z.object({
  defaultInterval: z.coerce.number().min(5).max(60),
  autoConfirm: z.boolean(),
  allowOverbooking: z.boolean(),
  overbookingLimit: z.coerce.number().min(0).max(5),
  reminderTime: z.enum(['none', '1h', '3h', '24h']),
  reminderChannel: z.enum(['sms', 'whatsapp', 'email']),
  maxSimultaneous: z.coerce.number().min(1).max(3),
});

type FormData = z.infer<typeof schema>;

export default function ScheduleSettings() {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultInterval: 30,
      autoConfirm: false,
      allowOverbooking: false,
      overbookingLimit: 1,
      reminderTime: 'none',
      reminderChannel: 'whatsapp',
      maxSimultaneous: 1,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('schedule_settings');
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, [form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('schedule_settings', JSON.stringify(data));
      toast.success('Configurações da Agenda salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      defaultInterval: 30,
      autoConfirm: false,
      allowOverbooking: false,
      overbookingLimit: 1,
      reminderTime: 'none',
      reminderChannel: 'whatsapp',
      maxSimultaneous: 1,
    });
    toast.success('Configurações restauradas para o padrão');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" description="Configure as regras de agendamento" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Regras */}
          <SettingsSection
            title="Regras de agendamento"
            description="Defina como os agendamentos devem ser criados e gerenciados"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="defaultInterval"
                render={({ field }) => (
                  <FieldGroup
                    label="Intervalo padrão (minutos)"
                    description="Duração padrão para novos agendamentos"
                  >
                    <Input type="number" min={5} max={60} {...field} className="max-w-xs" />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="autoConfirm"
                render={({ field }) => (
                  <FieldGroup
                    label="Confirmar automaticamente"
                    description="Novos agendamentos são confirmados sem intervenção manual"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="allowOverbooking"
                render={({ field }) => (
                  <FieldGroup
                    label="Permitir overbooking"
                    description="Permite agendar mais de um cliente no mesmo horário"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              {form.watch('allowOverbooking') && (
                <FormField
                  control={form.control}
                  name="overbookingLimit"
                  render={({ field }) => (
                    <FieldGroup
                      label="Limite de overbooking"
                      description="Máximo de agendamentos simultâneos permitidos"
                    >
                      <Input type="number" min={0} max={5} {...field} className="max-w-xs" />
                    </FieldGroup>
                  )}
                />
              )}
            </div>
          </SettingsSection>

          {/* Notificações */}
          <SettingsSection
            title="Notificações"
            description="Configure lembretes automáticos para clientes"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <FieldGroup
                    label="Lembrete para cliente"
                    description="Quando notificar o cliente sobre o agendamento"
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não enviar</SelectItem>
                        <SelectItem value="1h">1 hora antes</SelectItem>
                        <SelectItem value="3h">3 horas antes</SelectItem>
                        <SelectItem value="24h">24 horas antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="reminderChannel"
                render={({ field }) => (
                  <FieldGroup
                    label="Canal de notificação"
                    description="Como enviar os lembretes (simulado)"
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Profissionais */}
          <SettingsSection
            title="Profissionais"
            description="Configure regras para alocação de recursos"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="maxSimultaneous"
                render={({ field }) => (
                  <FieldGroup
                    label="Atendimentos simultâneos"
                    description="Máximo de clientes que um profissional pode atender ao mesmo tempo"
                  >
                    <Input type="number" min={1} max={3} {...field} className="max-w-xs" />
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
