import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getPlanInfo, updatePlan } from '@/lib/settings-api';
import { getAllPlans } from '@/lib/entitlements';
import { Check, Clock, X } from 'lucide-react';
import { ENDPOINTS } from '@/lib/env';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PlanInfo {
  plano: 'starter' | 'pro' | 'max';
  seatLimit: number;
  recursos: {
    products: { enabled: boolean };
    pdv: { enabled: boolean };
    stock: { enabled: boolean };
    agenda: { enabled: boolean };
    banho_tosa: { enabled: boolean };
    reports: { enabled: boolean };
  };
  ciclo: 'MENSAL' | 'ANUAL';
  proximoCobranca?: string;
}

interface HubPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  maxSeats: number;
  maxDevices: number;
  featuresEnabled: any;
}

interface Invoice {
  id: string;
  data: string;
  valor: string;
  status: string;
}

export default function PlanoPage() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [hubPlans, setHubPlans] = useState<HubPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHubOnline, setIsHubOnline] = useState(false);

  useEffect(() => {
    loadPlan();
    loadHubPlans();
    loadInvoices();
  }, []);

  const loadPlan = async () => {
    try {
      // Primeiro, tentar buscar informações do plano atual do Client-Local
      const tenantId = localStorage.getItem('2f.tenantId') || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
      
      try {
        // Buscar subscription do Client-Local (que busca do Hub quando online)
        const subscriptionResponse = await fetch(ENDPOINTS.CLIENT_PLANS_SUBSCRIPTION(tenantId), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
          },
        });

        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          
          // Mapear dados da subscription para o formato esperado
          const mappedPlanInfo: PlanInfo = {
            plano: subscription.planKey || 'starter',
            seatLimit: subscription.maxSeats || 1,
            recursos: {
              products: { enabled: true },
              pdv: { enabled: true },
              stock: { enabled: true },
              agenda: { enabled: subscription.planKey !== 'starter' },
              banho_tosa: { enabled: subscription.planKey !== 'starter' },
              reports: { enabled: subscription.planKey !== 'starter' },
            },
            ciclo: subscription.billingCycle === 'yearly' ? 'ANUAL' : 'MENSAL',
            proximoCobranca: subscription.nextBillingDate,
          };
          
          setPlanInfo(mappedPlanInfo);
          return;
        }
      } catch (subscriptionError) {
        console.warn('Erro ao buscar subscription do Client-Local:', subscriptionError);
      }

      // Fallback: usar método original se o novo endpoint falhar
      const info = await getPlanInfo();
      setPlanInfo(info);
    } catch (error) {
      console.error('Erro ao carregar informações do plano:', error);
      toast.error('Erro ao carregar informações do plano');
    } finally {
      setLoading(false);
    }
  };

  const loadHubPlans = async () => {
    try {
      // Buscar planos da API pública do Hub
      const response = await fetch(ENDPOINTS.HUB_PLANS);
      if (response.ok) {
        const plans = await response.json();
        setHubPlans(plans);
        setIsHubOnline(true);
        console.log('✅ Planos carregados do Hub:', plans.length);
      } else {
        console.warn('⚠️ Falha ao buscar planos do Hub, usando planos locais');
        setIsHubOnline(false);
        // Fallback para planos locais
        const localPlans = getAllPlans();
        const mappedPlans = localPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: 'BRL',
          billingCycle: 'monthly',
          maxSeats: plan.entitlements.seatLimit,
          maxDevices: 1,
          featuresEnabled: plan.entitlements
        }));
        setHubPlans(mappedPlans);
        console.log('📱 Usando planos locais como fallback:', mappedPlans.length);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar planos do Hub:', error);
      setIsHubOnline(false);
      // Fallback para planos locais
      const localPlans = getAllPlans();
      const mappedPlans = localPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: 'BRL',
        billingCycle: 'monthly',
        maxSeats: plan.entitlements.seatLimit,
        maxDevices: 1,
        featuresEnabled: plan.entitlements
      }));
      setHubPlans(mappedPlans);
      console.log('📱 Hub indisponível, usando planos locais:', mappedPlans.length);
    }
  };

  const loadInvoices = async () => {
    try {
      // Tentar buscar faturas do Client-Local primeiro
      const tenantId = localStorage.getItem('2f.tenantId') || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
      const response = await fetch(ENDPOINTS.CLIENT_PLANS_INVOICES(tenantId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      });

      if (response.ok) {
        const hubInvoices = await response.json();
        setInvoices(hubInvoices);
      } else {
        // Fallback: não mostrar faturas se não conseguir buscar do Hub
        setInvoices([]);
      }
    } catch (error) {
      console.warn('Erro ao buscar faturas do Hub:', error);
      // Fallback: não mostrar faturas se não conseguir buscar do Hub
      setInvoices([]);
    }
  };

  const handlePlanUpdate = async (planKey: 'starter' | 'pro' | 'max') => {
    try {
      await updatePlan(planKey);
      toast.success('Plano atualizado com sucesso');
      await loadPlan(); // Recarregar informações
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // Mapear plano do Hub para plano local
      const planMapping: { [key: string]: 'starter' | 'pro' | 'max' } = {
        'starter': 'starter',
        'pro': 'pro', 
        'max': 'max'
      };

      // Mapear baseado no preço ou nome do plano
      let mappedPlan: 'starter' | 'pro' | 'max' = 'starter';
      const selectedHubPlan = hubPlans.find(p => p.id === planId);
      
      if (selectedHubPlan) {
        if (selectedHubPlan.name.toLowerCase().includes('pro')) {
          mappedPlan = 'pro';
        } else if (selectedHubPlan.name.toLowerCase().includes('max')) {
          mappedPlan = 'max';
        } else {
          mappedPlan = 'starter';
        }
      }

      // Tentar criar assinatura no Hub primeiro
      const tenantId = localStorage.getItem('2f.tenantId') || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
      
      try {
        const subscriptionResponse = await fetch(ENDPOINTS.HUB_TENANTS_SUBSCRIPTION(tenantId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
          },
          body: JSON.stringify({
            planId: planId,
            billingCycle: 'monthly',
            status: 'active'
          }),
        });

        if (subscriptionResponse.ok) {
          // Atualizar plano local
          await handlePlanUpdate(mappedPlan);
          toast({
            title: 'Sucesso',
            description: 'Plano selecionado e assinatura criada com sucesso',
          });
          await loadPlan(); // Recarregar informações
          await loadInvoices(); // Recarregar faturas
          return;
        } else {
          const errorData = await subscriptionResponse.text();
          console.warn('Falha ao criar assinatura no Hub:', subscriptionResponse.status, errorData);
        }
      } catch (hubError) {
        console.warn('Hub não disponível, tentando fallback local:', hubError);
      }

      // Fallback: apenas atualizar localmente
      try {
        await handlePlanUpdate(mappedPlan);
        toast({
          title: 'Sucesso',
          description: 'Plano atualizado localmente (Hub indisponível)',
        });
        await loadPlan();
      } catch (localError) {
        console.error('Erro ao atualizar plano localmente:', localError);
        throw new Error('Falha ao atualizar plano tanto no Hub quanto localmente');
      }

    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      
      let errorMessage = 'Erro desconhecido ao selecionar plano';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique se os serviços estão rodando.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Erro ao processar dados do plano.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro ao selecionar plano',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (loading || !planInfo) return <div>Carregando...</div>;

  const allPlans = getAllPlans();
  const currentPlanData = allPlans.find(p => p.id === planInfo.plano);



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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Planos Disponíveis</h2>
          {!isHubOnline && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Modo Offline
            </Badge>
          )}
        </div>
        
        {!isHubOnline && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Modo Offline:</strong> O Hub não está disponível. Apenas seu plano atual está sendo exibido. 
              Para alterar planos ou ver todas as opções, verifique sua conexão com o Hub.
            </p>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-3">
          {hubPlans.map((plan) => {
            const isCurrentPlan = planInfo && (
              plan.id === planInfo.plano || 
              plan.name.toLowerCase() === planInfo.plano.toLowerCase()
            );
            
            // Buscar features do plano local correspondente
            const localPlan = allPlans.find(p => 
              p.id === plan.id || 
              p.name.toLowerCase() === plan.name.toLowerCase()
            );
            
            // No modo offline, desabilitar planos que não são o atual
            const isDisabled = !isHubOnline && !isCurrentPlan;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isCurrentPlan ? 'ring-2 ring-primary bg-primary/5' : ''} ${isDisabled ? 'opacity-60' : ''}`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Plano Atual
                    </Badge>
                  </div>
                )}
                {isDisabled && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="text-gray-500 border-gray-400">
                      Indisponível Offline
                    </Badge>
                  </div>
                )}
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
                    {/* Mostrar features do plano local se disponível */}
                    {localPlan?.features ? (
                      localPlan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>Até {plan.maxSeats} usuários</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{plan.maxDevices} dispositivo(s)</span>
                        </div>
                        {/* Mostrar features baseadas no featuresEnabled */}
                        {plan.featuresEnabled?.products && (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>Gestão de Produtos</span>
                          </div>
                        )}
                        {plan.featuresEnabled?.pdv && (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>PDV Completo</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || isDisabled}
                    variant={isCurrentPlan ? "secondary" : "default"}
                  >
                    {isCurrentPlan ? 'Plano Atual' : isDisabled ? 'Indisponível Offline' : 'Selecionar Plano'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>



      {/* Invoice History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Histórico de Cobranças</h2>
          {!isHubOnline && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Indisponível Offline
            </Badge>
          )}
        </div>
        
        {!isHubOnline ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-2">
                <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-medium text-gray-900">Histórico Indisponível</h3>
                <p className="text-sm text-gray-600">
                  O histórico de cobranças não está disponível no modo offline. 
                  Conecte-se ao Hub para visualizar suas faturas.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma fatura encontrada
                    </TableCell>
                  </TableRow>
                )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
