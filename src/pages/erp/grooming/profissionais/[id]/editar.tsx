import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfessionalById, updateProfessional } from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function EditarProfissional() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState(true);

  // Especialidades removidas deste fluxo de edição; não utilizadas no tipo Professional


  useEffect(() => {
    if (!id) return;

    const professional = getProfessionalById(id);
    if (!professional) {
      toast.error('Profissional não encontrado');
      navigate('/erp/grooming/profissionais');
      return;
    }

    setName(professional.name);
    setRole(professional.role || '');
    setPhone(professional.phone || '');
    setEmail(professional.email || '');
    setActive(professional.active);
    setLoading(false);
  }, [id, navigate]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!role.trim()) {
      toast.error('Função é obrigatória');
      return;
    }

    if (!phone.trim()) {
      toast.error('Telefone é obrigatório');
      return;
    }

    updateProfessional(id, {
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      active,
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
                <Label htmlFor="name">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do profissional"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">
                  Função <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex.: Tosadora, Banhista, Veterinária"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone/WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profissional Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Profissionais inativos não aparecem na busca
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
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