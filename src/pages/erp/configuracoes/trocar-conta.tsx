import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogIn, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { getUsers, getRoles, User } from '@/lib/settings-api';
// Removido uso direto de 'sonner' para evitar toasts duplicados.
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function TrocarContaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: string; nome: string }[]>([]);
  const [search, setSearch] = useState('');
  const [pin, setPin] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const { loginWithPin, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [u, r] = await Promise.all([getUsers(), getRoles()]);
      setUsers(u);
      setRoles(r);
    };
    load();
  }, []);

  const filtered = users
    .filter(u => u.ativo !== false)
    .filter(u =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  const promptPassword = (email: string) => {
    setSelectedEmail(email);
    setPin('');
    setModalOpen(true);
  };

  const handleLoginConfirm = async () => {
    if (!selectedEmail) return;
    setLoggingIn(true);
    const ok = await loginWithPin(selectedEmail, pin);
    setLoggingIn(false);
    if (ok) {
      setModalOpen(false);
      navigate('/erp/dashboard');
    } else {
      // Mensagens de erro e validações são tratadas no AuthContext (use-toast),
      // evitando duplicidade de toasts aqui.
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex items-center justify-between px-6 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp/settings')} title="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Trocar conta</h1>
        </div>
        <Button variant="destructive" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> Logoff total
        </Button>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6">
      {/* Campo de busca (opcional). Se quiser ocultar totalmente, comente o bloco abaixo. */}
        {/* <div className="max-w-md mx-auto mb-6">
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => {
          const roleName = roles.find(r => r.id === u.roleId)?.nome || u.roleId;
          const isCurrent = user?.email === u.email;
          return (
            <Card key={u.id} className={isCurrent ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{u.nome}</span>
                  {isCurrent && <Badge>Atual</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="text-sm">Papel: {roleName}</p>
                <div className="flex justify-end">
                  <Button
                    variant={isCurrent ? 'secondary' : 'default'}
                    onClick={() => promptPassword(u.email)}
                    disabled={isCurrent}
                  >
                    <LogIn className="h-4 w-4 mr-2" /> Entrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Modal de PIN */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar login por PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe o PIN de 4 dígitos para entrar como <strong>{selectedEmail}</strong>.</p>
            <Input
              type="password"
              inputMode="numeric"
              pattern="\\d{4}"
              maxLength={4}
              placeholder="PIN (4 dígitos)"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleLoginConfirm} disabled={loggingIn}>
              {loggingIn ? 'Entrando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
