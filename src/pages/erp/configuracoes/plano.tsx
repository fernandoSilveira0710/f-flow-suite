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

interface HubPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  active: boolean;
}

export default function PlanoPage() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [hubPlans, setHubPlans] = useState<HubPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    loadPlan();
    loadHubPlans();
  }, []);

  const loadPlan = async () => {
    const data = await getPlanInfo();
    setPlanInfo(data);
    setLoading(false);
  };

  const loadHubPlans = async () => {
    setLoadingPlans(true);
    try {
      // Buscar planos da API pública do Hub
      const response = await fetch('http://localhost:8081/public/plans?active=true');
      if (response.ok) {
        const plans = await response.json();
        setHubPlans(plans);
      } else {
        console.warn('Falha ao buscar planos do Hub, usando planos locais');
        // Fallback para planos locais
        const localPlans = getAllPlans();
        const mappedPlans = localPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          billingCycle: 'monthly',
          features: plan.features,
          active: true
        }));
        setHubPlans(mappedPlans);
      }
    } catch (error) {
      console.error('Erro ao buscar planos do Hub:', error);
      // Fallback para planos locais
      const localPlans = getAllPlans();
      const mappedPlans = localPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billingCycle: 'monthly',
        features: plan.features,
        active: true
      }));
      setHubPlans(mappedPlans);
    } finally {
      setLoadingPlans(false);
    }
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

  const handleSelectHubPlan = async (hubPlan: HubPlan) => {
    try {
      // Mapear plano do Hub para plano local
      let localPlanId: 'starter' | 'pro' | 'max' = 'starter';
      
      // Mapear baseado no preço ou nome do plano
      if (hubPlan.price <= 20) {
        localPlanId = 'starter';
      } else if (hubPlan.price <= 60) {
        localPlanId = 'pro';
      } else {
        localPlanId = 'max';
      }

      // Persistir usuário + licença no Hub
      const tenantId = localStorage.getItem('2f.tenantId') || 'demo';
      const subscriptionResponse = await fetch('http://localhost:8081/plans/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          tenantId,
          planId: hubPlan.id,
          billingCycle: hubPlan.billingCycle,
          status: 'active'
        }),
      });

      if (subscriptionResponse.ok) {
        console.log('Assinatura criada no Hub com sucesso');
        
        // Atualizar plano local
        await updatePlan(localPlanId);
        toast.success('Plano selecionado e assinatura criada com sucesso');
        loadPlan();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.warn('Falha ao criar assinatura no Hub, atualizando apenas localmente');
        await updatePlan(localPlanId);
        toast.success('Plano atualizado localmente');
        loadPlan();
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      toast.error('Erro ao selecionar plano');
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

      {/* Available Plans from Hub */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Planos Disponíveis no Hub</h2>
        {loadingPlans ? (
          <div>Carregando planos do Hub...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {hubPlans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">R$ {plan.price}</span>/{plan.billingCycle === 'monthly' ? 'mês' : 'ano'}
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
                  <Button
                    className="w-full"
                    onClick={() => handleSelectHubPlan(plan)}
                  >
                    Selecionar Plano
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
