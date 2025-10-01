import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { SettingsSection } from '@/components/settings/settings-section';
import { FieldGroup } from '@/components/settings/field-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getOrganization, updateOrganization, Organization } from '@/lib/settings-api';

const schema = z.object({
  nomeFantasia: z.string().min(1, 'Nome fantasia obrigatório'),
  razaoSocial: z.string().optional(),
  documento: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  timezone: z.string(),
  moeda: z.string(),
  idioma: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function OrganizacaoPage() {
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    getOrganization().then(data => {
      reset({
        ...data,
        logradouro: data.endereco?.logradouro,
        numero: data.endereco?.numero,
        bairro: data.endereco?.bairro,
        cidade: data.endereco?.cidade,
        uf: data.endereco?.uf,
        cep: data.endereco?.cep,
      });
    });
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const org: Organization = {
        tenantId: 'demo-tenant',
        nomeFantasia: data.nomeFantasia,
        razaoSocial: data.razaoSocial,
        documento: data.documento,
        email: data.email,
        telefone: data.telefone,
        endereco: {
          logradouro: data.logradouro,
          numero: data.numero,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          cep: data.cep,
        },
        timezone: data.timezone,
        moeda: data.moeda,
        idioma: data.idioma,
      };
      await updateOrganization(org);
      toast.success('Organização atualizada com sucesso');
      reset(data);
    } catch (error) {
      toast.error('Erro ao atualizar organização');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organização</h1>
        <p className="text-muted-foreground mt-1">Gerencie as informações da sua empresa</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SettingsSection title="Informações Básicas">
          <div className="grid gap-4">
            <FieldGroup label="Nome Fantasia" htmlFor="nomeFantasia">
              <Input id="nomeFantasia" {...register('nomeFantasia')} />
              {errors.nomeFantasia && <p className="text-sm text-destructive">{errors.nomeFantasia.message}</p>}
            </FieldGroup>

            <FieldGroup label="Razão Social" htmlFor="razaoSocial">
              <Input id="razaoSocial" {...register('razaoSocial')} />
            </FieldGroup>

            <FieldGroup label="CNPJ/CPF" htmlFor="documento">
              <Input id="documento" {...register('documento')} />
            </FieldGroup>

            <FieldGroup label="E-mail" htmlFor="email">
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </FieldGroup>

            <FieldGroup label="Telefone" htmlFor="telefone">
              <Input id="telefone" {...register('telefone')} />
            </FieldGroup>
          </div>
        </SettingsSection>

        <SettingsSection title="Endereço">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <FieldGroup label="Logradouro" htmlFor="logradouro">
                  <Input id="logradouro" {...register('logradouro')} />
                </FieldGroup>
              </div>
              <FieldGroup label="Número" htmlFor="numero">
                <Input id="numero" {...register('numero')} />
              </FieldGroup>
            </div>

            <FieldGroup label="Bairro" htmlFor="bairro">
              <Input id="bairro" {...register('bairro')} />
            </FieldGroup>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <FieldGroup label="Cidade" htmlFor="cidade">
                  <Input id="cidade" {...register('cidade')} />
                </FieldGroup>
              </div>
              <FieldGroup label="UF" htmlFor="uf">
                <Input id="uf" {...register('uf')} maxLength={2} />
              </FieldGroup>
            </div>

            <FieldGroup label="CEP" htmlFor="cep">
              <Input id="cep" {...register('cep')} />
            </FieldGroup>
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
