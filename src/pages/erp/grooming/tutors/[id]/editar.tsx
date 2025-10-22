import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getTutorById, updateTutor } from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function EditarTutor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!id) return;

    const tutor = getTutorById(id);
    if (!tutor) {
      toast.error('Tutor não encontrado');
      navigate('/erp/grooming/tutors');
      return;
    }

    setNome(tutor.nome);
    setTelefone(tutor.telefone || '');
    setEmail(tutor.email || '');
    setDocumento(tutor.documento || '');
    setEndereco(tutor.endereco || '');
    // Ajuste: Tutor usa campo 'notas' em vez de 'observacoes'
    setObservacoes(tutor.notas || '');
    setAtivo(tutor.ativo);
    setLoading(false);
  }, [id, navigate]);

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

    updateTutor(id, {
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      documento: documento.trim() || undefined,
      endereco: endereco.trim() || undefined,
      // Ajuste: enviar como 'notas' para o tipo Tutor
      notas: observacoes.trim() || undefined,
      ativo,
    });

    toast.success('Tutor atualizado!');
    navigate('/erp/grooming/tutors');
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/grooming/tutors')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Tutor</h1>
          <p className="text-muted-foreground mt-1">Atualize as informações do tutor</p>
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
                  placeholder="Nome do tutor"
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
                  placeholder="(00) 00000-0000"
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
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="CPF/CNPJ"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Notas importantes sobre o tutor"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/erp/grooming/tutors')}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}