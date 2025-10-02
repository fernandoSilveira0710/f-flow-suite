import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { createTutor } from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function NovoTutor() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [notas, setNotas] = useState('');
  const [ativo, setAtivo] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !telefone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    createTutor({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      documento: documento.trim() || undefined,
      endereco: endereco.trim() || undefined,
      notas: notas.trim() || undefined,
      ativo,
    });

    toast.success('Tutor cadastrado com sucesso');
    navigate('/erp/grooming/tutors');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/grooming/tutors')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Tutor</h1>
          <p className="text-muted-foreground mt-1">Cadastre um novo tutor</p>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label htmlFor="notas">Observações</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas e observações sobre o tutor"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tutor Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Tutores inativos não aparecem na busca rápida
              </p>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/erp/grooming/tutors')}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Tutor</Button>
        </div>
      </form>
    </div>
  );
}
