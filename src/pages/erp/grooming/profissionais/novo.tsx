import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { createProfessional } from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function NovoProfissional() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState(true);

  // Especialidades removidas: não utilizadas na criação padrão de Professional

  // Removido: controle de especialidades não é parte da interface Professional

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    createProfessional({
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      active,
    });

    toast.success('Profissional cadastrado!');
    navigate('/erp/grooming/profissionais');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/grooming/profissionais')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Profissional</h1>
          <p className="text-muted-foreground mt-1">Cadastre um novo profissional de banho & tosa</p>
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
          <Button type="submit">Salvar Profissional</Button>
        </div>
      </form>
    </div>
  );
}