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
  getProfessionalById,
  updateProfessional,
  type ProfessionalResponseDto,
  type UpdateProfessionalDto,
} from '@/lib/professionals-api';
import { getServices } from '@/lib/schedule-api';
import { ArrowLeft, User, Box } from 'lucide-react';

export default function EditarProfissional() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<ProfessionalResponseDto | null>(null);
  const services = getServices();

  const [role, setRole] = useState<'Professional' | 'Resource'>('Professional');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadedProfessional = getProfessionalById(id);
    if (!loadedProfessional) {
      toast({
        title: 'Erro',
        description: 'Profissional/Recurso não encontrado',
        variant: 'destructive',
      });
      navigate('/erp/agenda/profissionais');
      return;
    }

    setProfessional(loadedProfessional);
    setRole(loadedProfessional.role);
    setName(loadedProfessional.name);
    setEmail(loadedProfessional.email || '');
    setPhone(loadedProfessional.phone || '');
    setSpecialty(loadedProfessional.specialty || '');
    setDescription(loadedProfessional.description || '');
    setServiceIds(loadedProfessional.serviceIds || []);
    setActive(loadedProfessional.active);
    setLoading(false);
  }, [id, navigate, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    const updateData: UpdateProfessionalDto = {
      name: name.trim(),
      role,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      specialty: specialty.trim() || undefined,
      description: description.trim() || undefined,
      serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
      active,
    };

    const updated = updateProfessional(id, updateData);

    if (updated) {
      toast({
        title: `${role === 'Professional' ? 'Profissional' : 'Recurso'} atualizado`,
        description: `${updated.name} foi atualizado com sucesso`,
      });
      navigate('/erp/agenda/profissionais');
    }
  };

  const toggleService = (serviceId: string) => {
    setServiceIds(prev =>
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
          title={`Editar ${role === 'Professional' ? 'Profissional' : 'Recurso'}`}
          description={professional?.name}
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
              {role === 'Professional' ? (
                <User className="h-6 w-6" />
              ) : (
                <Box className="h-6 w-6" />
              )}
              <div>
                <p className="font-medium">
                  {role === 'Professional' ? 'Profissional' : 'Recurso'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {role === 'Professional' ? 'Atendente, funcionário' : 'Sala, box, cadeira'}
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
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="specialty">Especialidade</Label>
              <Input 
                id="specialty" 
                value={specialty} 
                onChange={e => setSpecialty(e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input 
                id="description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Atendidos</CardTitle>
            <CardDescription>
              Selecione quais serviços este {role === 'Professional' ? 'profissional' : 'recurso'}{' '}
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
                        checked={serviceIds.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativo</Label>
                <p className="text-sm text-muted-foreground">Inativos não aparecem na agenda</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
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
