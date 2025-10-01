import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { SettingsSection } from '@/components/settings/settings-section';
import { FieldGroup } from '@/components/settings/field-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getBranding, updateBranding } from '@/lib/settings-api';

const schema = z.object({
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  corPrimaria: z.string().optional(),
  corSecundaria: z.string().optional(),
  acento: z.string().optional(),
  tema: z.enum(['light', 'dark', 'system']),
  exibicaoMarcaPainel: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tema: 'light',
      exibicaoMarcaPainel: true,
    },
  });

  const exibicaoMarcaPainel = watch('exibicaoMarcaPainel');

  useEffect(() => {
    getBranding().then(data => {
      setValue('logoUrl', data.logoUrl || '');
      setValue('faviconUrl', data.faviconUrl || '');
      setValue('corPrimaria', data.corPrimaria || '#2563EB');
      setValue('corSecundaria', data.corSecundaria || '#22C55E');
      setValue('acento', data.acento || '#F59E0B');
      setValue('tema', data.tema);
      setValue('exibicaoMarcaPainel', data.exibicaoMarcaPainel);
      setLoading(false);
    });
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const brandingData = {
        ...data,
        tema: data.tema || 'light',
        exibicaoMarcaPainel: data.exibicaoMarcaPainel,
      };
      await updateBranding(brandingData);
      toast.success('Branding atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar branding');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Branding & Tema</h1>
        <p className="text-muted-foreground mt-1">Personalize a aparência do seu painel</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SettingsSection title="Logotipos">
          <div className="grid gap-4">
            <FieldGroup label="URL do Logo" htmlFor="logoUrl" description="Logo principal exibido no painel">
              <Input id="logoUrl" {...register('logoUrl')} placeholder="https://..." />
            </FieldGroup>

            <FieldGroup label="URL do Favicon" htmlFor="faviconUrl" description="Ícone exibido na aba do navegador">
              <Input id="faviconUrl" {...register('faviconUrl')} placeholder="https://..." />
            </FieldGroup>
          </div>
        </SettingsSection>

        <SettingsSection title="Cores">
          <div className="grid gap-4">
            <FieldGroup label="Cor Primária" htmlFor="corPrimaria">
              <Input id="corPrimaria" type="color" {...register('corPrimaria')} className="h-10 w-20" />
            </FieldGroup>

            <FieldGroup label="Cor Secundária" htmlFor="corSecundaria">
              <Input id="corSecundaria" type="color" {...register('corSecundaria')} className="h-10 w-20" />
            </FieldGroup>

            <FieldGroup label="Cor de Acento" htmlFor="acento">
              <Input id="acento" type="color" {...register('acento')} className="h-10 w-20" />
            </FieldGroup>
          </div>
        </SettingsSection>

        <SettingsSection title="Tema">
          <div className="grid gap-4">
            <FieldGroup label="Tema Padrão" htmlFor="tema">
              <Select
                value={watch('tema')}
                onValueChange={(value) => setValue('tema', value as 'light' | 'dark' | 'system')}
              >
                <SelectTrigger id="tema">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="exibicaoMarcaPainel">Exibir marca no painel</Label>
                <p className="text-xs text-muted-foreground">
                  Mostrar seu logo na barra lateral do ERP
                </p>
              </div>
              <Switch
                id="exibicaoMarcaPainel"
                checked={exibicaoMarcaPainel}
                onCheckedChange={(checked) => setValue('exibicaoMarcaPainel', checked)}
              />
            </div>
          </div>
        </SettingsSection>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
