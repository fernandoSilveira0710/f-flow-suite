import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getStaffById,
  updateStaff,
  getServices,
  type Staff,
  type StaffType,
} from '@/lib/schedule-api';
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

export default function EditarProfissional() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const services = getServices();

  const [tipo, setTipo] = useState<StaffType>('PROFISSIONAL');
  const [nome, setNome] = useState('');
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [cor, setCor] = useState('#6B7280');
  const [capacidade, setCapacidade] = useState('1');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadedStaff = getStaffById(id);
    if (!loadedStaff) {
      toast({
        title: 'Erro',
        description: 'Profissional/Recurso não encontrado',
        variant: 'destructive',
      });
      navigate('/erp/agenda/profissionais');
      return;
    }

    setStaff(loadedStaff);
    setTipo(loadedStaff.tipo);
    setNome(loadedStaff.nome);
    setFuncoes(loadedStaff.funcoes || []);
    setCor(loadedStaff.cores?.agenda || '#6B7280');
    setCapacidade((loadedStaff.capacidadeSimultanea || 1).toString());
    setAtivo(loadedStaff.ativo);
    setLoading(false);
  }, [id, navigate, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    const updated = updateStaff(id, {
      nome: nome.trim(),
      tipo,
      funcoes: funcoes.length > 0 ? funcoes : undefined,
      cores: { agenda: cor },
      capacidadeSimultanea: parseInt(capacidade) || 1,
      ativo,
    });

    if (updated) {
      toast({
        title: `${tipo === 'PROFISSIONAL' ? 'Profissional' : 'Recurso'} atualizado`,
        description: `${updated.nome} foi atualizado com sucesso`,
      });
      navigate('/erp/agenda/profissionais');
    }
  };

  const toggleFuncao = (serviceId: string) => {
    setFuncoes(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Editar ${tipo === 'PROFISSIONAL' ? 'Profissional' : 'Recurso'}`}
          description={staff?.nome}
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Tipo (read-only for now) */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              {tipo === 'PROFISSIONAL' ? (
                <User className="h-6 w-6" />
              ) : (
                <Box className="h-6 w-6" />
              )}
              <div>
                <p className="font-medium">
                  {tipo === 'PROFISSIONAL' ? 'Profissional' : 'Recurso'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tipo === 'PROFISSIONAL' ? 'Atendente, funcionário' : 'Sala, box, cadeira'}
                </p>
              </div>
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
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} required />
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
              <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
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
                Número de agendamentos simultâneos permitidos
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
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}
