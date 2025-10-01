import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPlanInfo, updatePlan, PlanInfo } from '@/lib/settings-api';
import { getAllPlans } from '@/lib/entitlements';

export default function PlanoPage() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    const data = await getPlanInfo();
    setPlanInfo(data);
    setLoading(false);
  };

  const handleChangePlan = async (newPlan: 'starter' | 'pro' | 'max') => {
    try {
      await updatePlan(newPlan);
      toast.success('Plano atualizado com sucesso');
      loadPlan();
      // Reload page to refresh entitlements in sidebar
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Erro ao atualizar plano');
    }
  };

  if (loading || !planInfo) return <div>Carregando...</div>;

  const allPlans = getAllPlans();
  const currentPlanData = allPlans.find(p => p.id === planInfo.plano);

  const mockInvoices = [
    { id: '1', data: '2024-01-15', valor: 'R$ 79,00', status: 'Pago' },
    { id: '2', data: '2023-12-15', valor: 'R$ 79,00', status: 'Pago' },
    { id: '3', data: '2023-11-15', valor: 'R$ 79,00', status: 'Pago' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plano & Faturamento</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua assinatura e histórico de pagamentos</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
          <CardDescription>
            {currentPlanData?.name} • {planInfo.ciclo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                R$ {planInfo.ciclo === 'MENSAL' ? currentPlanData?.price : currentPlanData?.priceAnnual}
                <span className="text-sm font-normal text-muted-foreground">
                  /{planInfo.ciclo === 'MENSAL' ? 'mês' : 'ano'}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Próxima cobrança: {new Date(planInfo.proximoCobranca || '').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/planos">Ver Todos os Planos</Link>
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Recursos inclusos:</p>
            <div className="grid gap-2">
              {currentPlanData?.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-secondary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Planos Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {allPlans.map((plan) => (
            <Card key={plan.id} className={plan.id === planInfo.plano ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.id === planInfo.plano && (
                    <Badge>Atual</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">R$ {plan.price}</span>/mês
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.slice(0, 4).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {plan.id !== planInfo.plano && (
                  <Button
                    className="w-full"
                    onClick={() => handleChangePlan(plan.id)}
                  >
                    {plan.price > (currentPlanData?.price || 0) ? 'Fazer Upgrade' : 'Mudar para este Plano'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Histórico de Cobranças</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {new Date(invoice.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{invoice.valor}</TableCell>
                    <TableCell>
                      <Badge variant="default">{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver Recibo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
