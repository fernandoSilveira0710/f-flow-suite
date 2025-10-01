import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SettingsSection } from '@/components/settings/settings-section';
import { FieldGroup } from '@/components/settings/field-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function NotificacoesPage() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      emailRemetente: 'noreply@2fsolutions.com.br',
      template: 'Olá {{nome}},\n\nSeu pedido foi confirmado!\n\nAtenciosamente,\nEquipe 2F Solutions',
      enviarReciboPorEmail: true,
      enviarWhatsApp: false,
    },
  });

  const [enviarReciboPorEmail, setEnviarReciboPorEmail] = useState(true);
  const [enviarWhatsApp, setEnviarWhatsApp] = useState(false);

  const onSubmit = async (data: any) => {
    toast.success('Configurações de notificações salvas (mock)');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notificações</h1>
        <p className="text-muted-foreground mt-1">Configure o envio de e-mails e mensagens automáticas</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SettingsSection title="E-mail">
          <div className="grid gap-4">
            <FieldGroup label="E-mail Remetente" htmlFor="emailRemetente">
              <Input id="emailRemetente" {...register('emailRemetente')} />
            </FieldGroup>

            <FieldGroup label="Template de E-mail" htmlFor="template" description="Use {{nome}}, {{valor}}, etc para personalizar">
              <Textarea id="template" {...register('template')} rows={6} />
            </FieldGroup>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enviarReciboPorEmail">Enviar recibo por e-mail</Label>
                <p className="text-xs text-muted-foreground">
                  Envia recibo automaticamente após venda
                </p>
              </div>
              <Switch
                id="enviarReciboPorEmail"
                checked={enviarReciboPorEmail}
                onCheckedChange={setEnviarReciboPorEmail}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="WhatsApp">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enviarWhatsApp">Enviar notificações por WhatsApp</Label>
                <p className="text-xs text-muted-foreground">
                  Requer integração com API de WhatsApp Business
                </p>
              </div>
              <Switch
                id="enviarWhatsApp"
                checked={enviarWhatsApp}
                onCheckedChange={setEnviarWhatsApp}
              />
            </div>
          </div>
        </SettingsSection>

        <div className="flex justify-end">
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}
