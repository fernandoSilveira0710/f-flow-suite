import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createProfessional, type CreateProfessionalDto } from '@/lib/professionals-api';
import { getServices, type StaffType } from '@/lib/schedule-api';
import { ArrowLeft, User, Box } from 'lucide-react';

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#F59E0B', label: 'Âmbar' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6B7280', label: 'Cinza' },
  { value: '#14B8A6', label: 'Teal' },
];

const weekdays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export default function NovoProfissional() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const services = getServices();

  const [tipo, setTipo] = useState<StaffType>('PROFISSIONAL');
  const [nome, setNome] = useState('');
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [cor, setCor] = useState('#6B7280');
  const [capacidade, setCapacidade] = useState('1');
  const [ativo, setAtivo] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    const professionalData: CreateProfessionalDto = {
      name: nome.trim(),
      serviceIds: funcoes,
      active: ativo,
    };

    const professional = createProfessional(professionalData);

    toast({
      title: 'Profissional criado',
      description: `${professional.name} foi cadastrado com sucesso`,
    });

    navigate('/erp/agenda/profissionais');
  };

  const toggleFuncao = (serviceId: string) => {
    setFuncoes(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Novo Profissional"
          description="Cadastre um profissional"
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo</CardTitle>
            <CardDescription>Selecione o tipo: profissional ou recurso físico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipo('PROFISSIONAL')}
                className={`p-6 border-2 rounded-lg flex flex-col items-center gap-3 transition-all ${
                  tipo === 'PROFISSIONAL'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <User className="h-8 w-8" />
                <div className="text-center">
                  <p className="font-medium">Profissional</p>
                  <p className="text-xs text-muted-foreground">Atendente, funcionário</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipo('RECURSO')}
                className={`p-6 border-2 rounded-lg flex flex-col items-center gap-3 transition-all ${
                  tipo === 'RECURSO'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Box className="h-8 w-8" />
                <div className="text-center">
                  <p className="font-medium">Recurso</p>
                  <p className="text-xs text-muted-foreground">Sala, box, cadeira</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder={
                  tipo === 'PROFISSIONAL' ? 'Ex: Maria Silva' : 'Ex: Sala 1, Box A'
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="cor">Cor na Agenda</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCor(option.value)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      cor === option.value ? 'border-primary scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Atendidos</CardTitle>
            <CardDescription>
              Selecione quais serviços este {tipo === 'PROFISSIONAL' ? 'profissional' : 'recurso'}{' '}
              pode atender
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço cadastrado.{' '}
                <Button variant="link" className="p-0 h-auto" asChild>
                  <a href="/erp/agenda/servicos/novo">Criar serviço</a>
                </Button>
              </p>
            ) : (
              <div className="space-y-2">
                {services
                  .filter(s => s.ativo)
                  .map(service => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={funcoes.includes(service.id)}
                        onCheckedChange={() => toggleFuncao(service.id)}
                      />
                      <Label
                        htmlFor={`service-${service.id}`}
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        {service.cor && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: service.cor }}
                          />
                        )}
                        {service.nome}
                        <span className="text-muted-foreground">
                          ({service.duracaoMin} min)
                        </span>
                      </Label>
                    </div>
                  ))}
                {funcoes.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Deixe vazio para permitir todos os serviços
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="capacidade">Capacidade Simultânea</Label>
              <Input
                id="capacidade"
                type="number"
                min="1"
                value={capacidade}
                onChange={e => setCapacidade(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número de agendamentos simultâneos permitidos (padrão: 1)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativo</Label>
                <p className="text-sm text-muted-foreground">Inativos não aparecem na agenda</p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar {tipo === 'PROFISSIONAL' ? 'Profissional' : 'Recurso'}
          </Button>
        </div>
      </form>
    </div>
  );
}
