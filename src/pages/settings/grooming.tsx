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
import { Checkbox } from '@/components/ui/checkbox';
import GroomingCategoriesIndex from '@/pages/erp/grooming/categories/index';
import GroomingResourceTypesIndex from '@/pages/erp/grooming/resource-types/index';
import GroomingSpecialtiesIndex from '@/pages/erp/grooming/specialties/index';

const schema = z.object({
  activeColumns: z.array(z.string()).min(1, 'Selecione ao menos uma coluna'),
  notifyOnReady: z.boolean(),
  requireExclusiveResource: z.boolean(),
  durationPP: z.coerce.number().min(15).max(180),
  durationP: z.coerce.number().min(15).max(180),
  durationM: z.coerce.number().min(15).max(180),
  durationG: z.coerce.number().min(15).max(180),
  durationGG: z.coerce.number().min(15).max(180),
  includeQrCode: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const COLUMNS = [
  { value: 'CHECKIN', label: 'Check-in' },
  { value: 'BANHO', label: 'Banho' },
  { value: 'SECAGEM', label: 'Secagem' },
  { value: 'TOSA', label: 'Tosa' },
  { value: 'FINALIZACAO', label: 'Finalização' },
  { value: 'PRONTO', label: 'Pronto' },
  { value: 'ENTREGUE', label: 'Entregue' },
];

export default function GroomingSettings() {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      activeColumns: ['CHECKIN', 'BANHO', 'SECAGEM', 'TOSA', 'FINALIZACAO', 'PRONTO', 'ENTREGUE'],
      notifyOnReady: true,
      requireExclusiveResource: false,
      durationPP: 30,
      durationP: 45,
      durationM: 60,
      durationG: 90,
      durationGG: 120,
      includeQrCode: true,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('grooming_settings');
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, [form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('grooming_settings', JSON.stringify(data));
      toast.success('Configurações de Banho & Tosa salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      activeColumns: ['CHECKIN', 'BANHO', 'SECAGEM', 'TOSA', 'FINALIZACAO', 'PRONTO', 'ENTREGUE'],
      notifyOnReady: true,
      requireExclusiveResource: false,
      durationPP: 30,
      durationP: 45,
      durationM: 60,
      durationG: 90,
      durationGG: 120,
      includeQrCode: true,
    });
    toast.success('Configurações restauradas para o padrão');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Banho & Tosa" description="Configure o fluxo operacional do grooming" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Fluxo */}
          <SettingsSection
            title="Fluxo operacional"
            description="Defina as etapas ativas e comportamentos do processo"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="activeColumns"
                render={({ field }) => (
                  <FieldGroup
                    label="Colunas ativas"
                    description="Selecione as etapas que serão exibidas no quadro"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {COLUMNS.map((col) => (
                        <div key={col.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={col.value}
                            checked={field.value.includes(col.value)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...field.value, col.value]
                                : field.value.filter((v) => v !== col.value);
                              field.onChange(updated);
                            }}
                          />
                          <label htmlFor={col.value} className="text-sm cursor-pointer">
                            {col.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="notifyOnReady"
                render={({ field }) => (
                  <FieldGroup
                    label="Notificar quando pronto"
                    description="Envia notificação ao tutor quando status = Pronto"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />

              <FormField
                control={form.control}
                name="requireExclusiveResource"
                render={({ field }) => (
                  <FieldGroup
                    label="Recurso exclusivo para Tosa"
                    description="Exige que a etapa de Tosa tenha um profissional dedicado"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Duração por porte */}
          <SettingsSection
            title="Duração padrão por porte"
            description="Tempo estimado (em minutos) para cada tamanho de pet"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="durationPP"
                render={({ field }) => (
                  <FieldGroup label="PP (Mini)">
                    <Input type="number" min={15} max={180} {...field} />
                  </FieldGroup>
                )}
              />
              <FormField
                control={form.control}
                name="durationP"
                render={({ field }) => (
                  <FieldGroup label="P (Pequeno)">
                    <Input type="number" min={15} max={180} {...field} />
                  </FieldGroup>
                )}
              />
              <FormField
                control={form.control}
                name="durationM"
                render={({ field }) => (
                  <FieldGroup label="M (Médio)">
                    <Input type="number" min={15} max={180} {...field} />
                  </FieldGroup>
                )}
              />
              <FormField
                control={form.control}
                name="durationG"
                render={({ field }) => (
                  <FieldGroup label="G (Grande)">
                    <Input type="number" min={15} max={180} {...field} />
                  </FieldGroup>
                )}
              />
              <FormField
                control={form.control}
                name="durationGG"
                render={({ field }) => (
                  <FieldGroup label="GG (Gigante)">
                    <Input type="number" min={15} max={180} {...field} />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Etiquetas */}
          <SettingsSection
            title="Etiquetas"
            description="Configure a impressão de etiquetas para identificação"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="includeQrCode"
                render={({ field }) => (
                  <FieldGroup
                    label="Incluir QR Code"
                    description="Adiciona código QR com URL do ticket na etiqueta"
                  >
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FieldGroup>
                )}
              />
            </div>
          </SettingsSection>

          {/* Categorias de Serviços */}
          <SettingsSection
            title="Categorias de Serviços"
            description="Gerencie as categorias disponíveis para os serviços de grooming"
          >
            <div className="mt-4">
              <GroomingCategoriesIndex />
            </div>
          </SettingsSection>

          {/* Tipos de Recursos */}
          <SettingsSection
            title="Tipos de Recursos"
            description="Gerencie os tipos de recursos físicos disponíveis para o grooming"
          >
            <div className="mt-4">
              <GroomingResourceTypesIndex />
            </div>
          </SettingsSection>

          {/* Especialidades */}
          <SettingsSection
            title="Especialidades"
            description="Gerencie as especialidades disponíveis para os profissionais"
          >
            <div className="mt-4">
              <GroomingSpecialtiesIndex />
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
