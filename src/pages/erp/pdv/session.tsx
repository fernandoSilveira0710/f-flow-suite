import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DoorOpen } from 'lucide-react';
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
import { openSession } from '@/lib/pos-api';

export default function SessionPage() {
  const navigate = useNavigate();
  const [saldoInicial, setSaldoInicial] = useState('100.00');
  const [loading, setLoading] = useState(false);

  const handleOpenSession = async () => {
    const valor = parseFloat(saldoInicial);
    if (isNaN(valor) || valor < 0) {
      toast.error('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      await openSession(valor, { id: 'admin-1', nome: 'Admin Demo' });
      toast.success('Caixa aberto com sucesso!');
      navigate('/erp/pdv');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir caixa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Abrir Caixa</CardTitle>
              <CardDescription>Informe o saldo inicial</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="saldoInicial">Saldo Inicial (R$)</Label>
            <Input
              id="saldoInicial"
              type="number"
              step="0.01"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder="100.00"
            />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Data/Hora: {new Date().toLocaleString('pt-BR')}</p>
            <p>• Operador: Admin Demo</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/erp/pdv')}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleOpenSession}
              disabled={loading}
            >
              Confirmar Abertura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
