import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ENDPOINTS } from '@/lib/env';
import { useAuth } from '@/contexts/auth-context';

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function DadosPage() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const email = String(user?.email || '').trim().toLowerCase();
  const cleanPin = useMemo(() => String(pin || '').replace(/\D/g, '').slice(0, 4), [pin]);

  const handleConfirm = async () => {
    if (!email) {
      toast.error('Usuário não autenticado.');
      return;
    }
    if (cleanPin.length !== 4) {
      toast.error('Informe um PIN de 4 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const pinRes = await fetch(ENDPOINTS.CLIENT_AUTH_OFFLINE_PIN_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: cleanPin }),
      });
      if (!pinRes.ok) {
        const data = await parseJsonSafe(pinRes);
        toast.error(data?.message || 'PIN incorreto.');
        return;
      }

      const resetRes = await fetch(ENDPOINTS.CLIENT_MAINTENANCE_RESET_DATABASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: cleanPin }),
      });
      if (!resetRes.ok) {
        const data = await parseJsonSafe(resetRes);
        toast.error(data?.message || 'Falha ao limpar base local.');
        return;
      }

      localStorage.setItem('db_cleared', 'true');
      setOpen(false);
      logout();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao limpar base local.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dados</h1>
        <p className="text-muted-foreground mt-1">Ações administrativas sobre a base local</p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir todos os dados e redefinir
          </CardTitle>
          <CardDescription>
            Esta ação remove a base SQLite do client-local. O ERP será deslogado e você precisará fazer login novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Database className="h-4 w-4" />
            Base local (SQLite)
          </div>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Excluir dados e redefinir
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={(v) => (loading ? null : setOpen(v))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar limpeza da base</AlertDialogTitle>
            <AlertDialogDescription>
              Para confirmar, informe o PIN do admin. Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="admin-pin">PIN</Label>
            <Input
              id="admin-pin"
              inputMode="numeric"
              type="password"
              placeholder="4 dígitos"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={loading}
              maxLength={8}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              Confirmar e limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

