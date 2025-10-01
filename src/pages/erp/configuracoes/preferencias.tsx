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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  getPosPrefs,
  updatePosPrefs,
  getAgendaPrefs,
  updateAgendaPrefs,
  getPetPrefs,
  updatePetPrefs,
  getStockPrefs,
  updateStockPrefs,
} from '@/lib/settings-api';

const posSchema = z.object({
  impressora: z.enum(['nenhuma', 'termica', 'a4']),
  reciboAuto: z.boolean(),
  abrirGaveta: z.boolean(),
});

const agendaSchema = z.object({
  intervaloPadraoMin: z.number().min(5).max(120),
  permitirDuploAgendamento: z.boolean(),
});

const petSchema = z.object({
  banhoDuracaoMin: z.number().min(15).max(180),
  tosaDuracaoMin: z.number().min(30).max(240),
  pedirAssinaturaTermo: z.boolean(),
});

const stockSchema = z.object({
  estoqueMinimoPadrao: z.number().min(0),
  bloquearVendaSemEstoque: z.boolean(),
});

export default function PreferenciasPage() {
  const [activeTab, setActiveTab] = useState('pdv');

  // PDV Form
  const posForm = useForm({
    resolver: zodResolver(posSchema),
    defaultValues: { impressora: 'nenhuma' as 'nenhuma' | 'termica' | 'a4', reciboAuto: false, abrirGaveta: false },
  });

  // Agenda Form
  const agendaForm = useForm({
    resolver: zodResolver(agendaSchema),
    defaultValues: { intervaloPadraoMin: 30, permitirDuploAgendamento: false },
  });

  // Pet Form
  const petForm = useForm({
    resolver: zodResolver(petSchema),
    defaultValues: { banhoDuracaoMin: 45, tosaDuracaoMin: 90, pedirAssinaturaTermo: true },
  });

  // Stock Form
  const stockForm = useForm({
    resolver: zodResolver(stockSchema),
    defaultValues: { estoqueMinimoPadrao: 10, bloquearVendaSemEstoque: true },
  });

  useEffect(() => {
    loadAllPrefs();
  }, []);

  const loadAllPrefs = async () => {
    const [pos, agenda, pet, stock] = await Promise.all([
      getPosPrefs(),
      getAgendaPrefs(),
      getPetPrefs(),
      getStockPrefs(),
    ]);
    posForm.reset(pos);
    agendaForm.reset(agenda);
    petForm.reset(pet);
    stockForm.reset(stock);
  };

  const onPosSubmit = async (data: z.infer<typeof posSchema>) => {
    try {
      const payload = {
        impressora: data.impressora,
        reciboAuto: data.reciboAuto,
        abrirGaveta: data.abrirGaveta,
      };
      await updatePosPrefs(payload);
      toast.success('Preferências do PDV atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  const onAgendaSubmit = async (data: z.infer<typeof agendaSchema>) => {
    try {
      const payload = {
        intervaloPadraoMin: data.intervaloPadraoMin,
        permitirDuploAgendamento: data.permitirDuploAgendamento,
      };
      await updateAgendaPrefs(payload);
      toast.success('Preferências da Agenda atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  const onPetSubmit = async (data: z.infer<typeof petSchema>) => {
    try {
      const payload = {
        banhoDuracaoMin: data.banhoDuracaoMin,
        tosaDuracaoMin: data.tosaDuracaoMin,
        pedirAssinaturaTermo: data.pedirAssinaturaTermo,
      };
      await updatePetPrefs(payload);
      toast.success('Preferências do Banho & Tosa atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  const onStockSubmit = async (data: z.infer<typeof stockSchema>) => {
    try {
      const payload = {
        estoqueMinimoPadrao: data.estoqueMinimoPadrao,
        bloquearVendaSemEstoque: data.bloquearVendaSemEstoque,
      };
      await updateStockPrefs(payload);
      toast.success('Preferências do Estoque atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preferências dos Módulos</h1>
        <p className="text-muted-foreground mt-1">Configure o comportamento de cada módulo do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pdv">PDV</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="pet">Banho & Tosa</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="pdv" className="space-y-6">
          <form onSubmit={posForm.handleSubmit(onPosSubmit)} className="space-y-6">
            <SettingsSection title="Configurações do PDV">
              <div className="grid gap-4">
                <FieldGroup label="Impressora Padrão" htmlFor="impressora">
                  <Select
                    value={posForm.watch('impressora')}
                    onValueChange={(value) => posForm.setValue('impressora', value as any)}
                  >
                    <SelectTrigger id="impressora">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">Nenhuma</SelectItem>
                      <SelectItem value="termica">Impressora Térmica</SelectItem>
                      <SelectItem value="a4">Impressora A4</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reciboAuto">Imprimir recibo automaticamente</Label>
                    <p className="text-xs text-muted-foreground">
                      Imprime o recibo após finalizar venda
                    </p>
                  </div>
                  <Switch
                    id="reciboAuto"
                    checked={posForm.watch('reciboAuto')}
                    onCheckedChange={(checked) => posForm.setValue('reciboAuto', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="abrirGaveta">Abrir gaveta automaticamente</Label>
                    <p className="text-xs text-muted-foreground">
                      Abre a gaveta ao finalizar venda
                    </p>
                  </div>
                  <Switch
                    id="abrirGaveta"
                    checked={posForm.watch('abrirGaveta')}
                    onCheckedChange={(checked) => posForm.setValue('abrirGaveta', checked)}
                  />
                </div>
              </div>
            </SettingsSection>
            <div className="flex justify-end">
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          <form onSubmit={agendaForm.handleSubmit(onAgendaSubmit)} className="space-y-6">
            <SettingsSection title="Configurações da Agenda">
              <div className="grid gap-4">
                <FieldGroup label="Intervalo padrão (minutos)" htmlFor="intervaloPadraoMin">
                  <Input
                    id="intervaloPadraoMin"
                    type="number"
                    {...agendaForm.register('intervaloPadraoMin', { valueAsNumber: true })}
                  />
                </FieldGroup>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="permitirDuploAgendamento">Permitir duplo agendamento</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite agendar dois serviços no mesmo horário
                    </p>
                  </div>
                  <Switch
                    id="permitirDuploAgendamento"
                    checked={agendaForm.watch('permitirDuploAgendamento')}
                    onCheckedChange={(checked) => agendaForm.setValue('permitirDuploAgendamento', checked)}
                  />
                </div>
              </div>
            </SettingsSection>
            <div className="flex justify-end">
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="pet" className="space-y-6">
          <form onSubmit={petForm.handleSubmit(onPetSubmit)} className="space-y-6">
            <SettingsSection title="Configurações do Banho & Tosa">
              <div className="grid gap-4">
                <FieldGroup label="Duração padrão do banho (minutos)" htmlFor="banhoDuracaoMin">
                  <Input
                    id="banhoDuracaoMin"
                    type="number"
                    {...petForm.register('banhoDuracaoMin', { valueAsNumber: true })}
                  />
                </FieldGroup>

                <FieldGroup label="Duração padrão da tosa (minutos)" htmlFor="tosaDuracaoMin">
                  <Input
                    id="tosaDuracaoMin"
                    type="number"
                    {...petForm.register('tosaDuracaoMin', { valueAsNumber: true })}
                  />
                </FieldGroup>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pedirAssinaturaTermo">Solicitar assinatura de termo</Label>
                    <p className="text-xs text-muted-foreground">
                      Exige assinatura do tutor antes do serviço
                    </p>
                  </div>
                  <Switch
                    id="pedirAssinaturaTermo"
                    checked={petForm.watch('pedirAssinaturaTermo')}
                    onCheckedChange={(checked) => petForm.setValue('pedirAssinaturaTermo', checked)}
                  />
                </div>
              </div>
            </SettingsSection>
            <div className="flex justify-end">
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-6">
            <SettingsSection title="Configurações do Estoque">
              <div className="grid gap-4">
                <FieldGroup label="Estoque mínimo padrão" htmlFor="estoqueMinimoPadrao">
                  <Input
                    id="estoqueMinimoPadrao"
                    type="number"
                    {...stockForm.register('estoqueMinimoPadrao', { valueAsNumber: true })}
                  />
                </FieldGroup>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="bloquearVendaSemEstoque">Bloquear venda sem estoque</Label>
                    <p className="text-xs text-muted-foreground">
                      Impede venda de produtos com estoque zerado
                    </p>
                  </div>
                  <Switch
                    id="bloquearVendaSemEstoque"
                    checked={stockForm.watch('bloquearVendaSemEstoque')}
                    onCheckedChange={(checked) => stockForm.setValue('bloquearVendaSemEstoque', checked)}
                  />
                </div>
              </div>
            </SettingsSection>
            <div className="flex justify-end">
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
