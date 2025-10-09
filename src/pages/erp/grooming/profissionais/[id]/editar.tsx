import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfessionalById, updateProfessional } from '@/lib/grooming-api';
import { getSpecialties } from '@/pages/erp/grooming/specialties';
import { toast } from 'sonner';

export default function EditarProfissional() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [especialidadesDisponiveis, setEspecialidadesDisponiveis] = useState<any[]>([]);

  useEffect(() => {
    // Carrega especialidades do localStorage
    const specialties = getSpecialties();
    setEspecialidadesDisponiveis(specialties);
  }, []);

  useEffect(() => {
    if (!id) return;

    const professional = getProfessionalById(id);
    if (!professional) {
      toast.error('Profissional não encontrado');
      navigate('/erp/grooming/profissionais');
      return;
    }

    setNome(professional.nome);
    setTelefone(professional.telefone || '');
    setEmail(professional.email || '');
    setDocumento(professional.documento || '');
    setEndereco(professional.endereco || '');
    setEspecialidades(professional.especialidades || []);
    setObservacoes(professional.observacoes || '');
    setAtivo(professional.ativo);
    setLoading(false);
  }, [id, navigate]);

  const handleEspecialidadeChange = (especialidade: string, checked: boolean) => {
    if (checked) {
      setEspecialidades([...especialidades, especialidade]);
    } else {
      setEspecialidades(especialidades.filter(e => e !== especialidade));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!telefone.trim()) {
      toast.error('Telefone é obrigatório');
      return;
    }

    if (especialidades.length === 0) {
      toast.error('Selecione pelo menos uma especialidade');
      return;
    }

    updateProfessional(id, {
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      documento: documento.trim() || undefined,
      endereco: endereco.trim() || undefined,
      especialidades,
      observacoes: observacoes.trim() || undefined,
      ativo,
    });

    toast.success('Profissional atualizado!');
    navigate('/erp/grooming/profissionais');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/grooming/profissionais')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Profissional</h1>
          <p className="text-muted-foreground mt-1">Atualize as informações do profissional</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Informações Básicas</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do profissional"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone/WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">CPF/CNPJ</Label>
                <Input
                  id="documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Especialidades <span className="text-destructive">*</span></h3>
            <div className="grid gap-3 md:grid-cols-2">
              {especialidadesDisponiveis.map((esp) => (
                <div key={esp.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={esp.id}
                    checked={especialidades.includes(esp.name)}
                    onCheckedChange={(checked) => handleEspecialidadeChange(esp.name, !!checked)}
                  />
                  <Label htmlFor={esp.id} className="text-sm font-normal">
                    {esp.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o profissional"
              rows={3}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profissional Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Profissionais inativos não aparecem na busca
              </p>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/erp/grooming/profissionais')}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}