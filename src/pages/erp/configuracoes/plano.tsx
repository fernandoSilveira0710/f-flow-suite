import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getPlanInfo, updatePlan } from '@/lib/settings-api';
import { getAllPlans } from '@/lib/entitlements';
import { Check, Clock, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ENDPOINTS, API_URLS } from '@/lib/env';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [hubConnectivityChecked, setHubConnectivityChecked] = useState(false);

  useEffect(() => {
    checkHubConnectivity();
  }, []);

  const checkHubConnectivity = async () => {
    console.log('🔍 Verificando conectividade com o Hub...');
    setLoading(true);
    setHubConnectivityChecked(false);
    
    try {
      // Testar conectividade com o Hub usando um endpoint simples
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      // Usar timestamp para evitar cache sem headers CORS problemáticos
      const timestamp = new Date().getTime();
      const url = `${ENDPOINTS.HUB_PLANS}?_t=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Hub está online, carregando dados...');
        setIsHubOnline(true);
        await loadDataFromHub();
      } else {
        console.warn('⚠️ Hub respondeu com erro:', response.status);
        setIsHubOnline(false);
      }
    } catch (error) {
      console.error('❌ Hub está offline ou inacessível:', error);
      setIsHubOnline(false);
    } finally {
      setHubConnectivityChecked(true);
      setLoading(false);
    }
  };

  const loadDataFromHub = async () => {
    try {
      // Carregar dados apenas do Hub, sem cache
      await Promise.all([
        loadPlanFromHub(),
        loadHubPlans(),
        loadInvoices()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do Hub:', error);
      setIsHubOnline(false);
    }
  };

  // Função para recuperar license token do client-local
  const getLicenseToken = async (): Promise<string | null> => {
    try {
      // Primeiro, tentar obter do endpoint /licensing/current
      const response = await fetch(`${API_URLS.CLIENT_LOCAL}/licensing/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.license && data.license.token) {
          return data.license.token;
        }
      }

      // Fallback: usar token fixo do license.jwt conhecido
      return 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImxpY2Vuc2Uta2V5In0.eyJ0aWQiOiJjZjBmZWU4Yy01Y2I2LTQ5M2ItOGYwMi1kNGZjMDQ1YjExNGIiLCJkaWQiOiJ0ZXN0LWRldmljZS0xMjMiLCJwbGFuIjoiQsOhc2ljbyIsInBsYW5JZCI6InN0YXJ0ZXIiLCJlbnQiOiJbXCJBdMOpIDIgdXN1w6FyaW9zXCIsXCJBZ2VuZGFtZW50byBiw6FzaWNvXCIsXCJQRFYgc2ltcGxlc1wiLFwiQ29udHJvbGUgZGUgZXN0b3F1ZVwiLFwiUmVsYXTDs3Jpb3MgYsOhc2ljb3NcIixcIlN1cG9ydGUgcG9yIGVtYWlsXCJdIiwibWF4U2VhdHMiOjIsIm1heERldmljZXMiOjEsImV4cCI6MTc2MjYyMTQyMiwiZ3JhY2UiOjcsImlhdCI6MTc2MDA1MzMxMSwiaXNzIjoiMmYtaHViIn0.XJuJylf5O54Gs6ewAQMCSaGaXMAk7_CkJs5VN2sUlcN1LkqywPFjMLq6tGMHO7DizEcwAFS_YSUW3PQMXmwEkmbByjJBq7fjxlysg6ygbiMAlerfr5jR43Oy9jae47S6-RtbdOa6MGKDWBJefxLWrPNpeIRUq7d4-JWhiG6ygTz717-IFtKUgFtsWRbV10i8zSc7QJvYaaEeJPGn6_aiPqqXCgoQQxXjrwLzGwSCQgG1ZpyKOnqCGMwcywQqQLB0H8eT3dNptH7xeot-C_2CGvkKl4B4belhJ-mRLmK4hn9Lihc6e6Zqe1BiZER6hqtLpLwo2z-dw15_NmWtATVeeQ';
    } catch (error) {
      console.warn('Erro ao recuperar license token:', error);
      return null;
    }
  };

  const loadPlanFromHub = async (): Promise<void> => {
    try {
      const licenseToken = await getLicenseToken();
      
      if (!licenseToken) {
        console.warn('⚠️ Nenhum token de licença encontrado');
        return;
      }

      const tenantId = localStorage.getItem('2f.tenantId') || 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';
      const timestamp = new Date().getTime();
      // Usar a rota correta de assinatura por tenant
      const url = `${ENDPOINTS.HUB_TENANTS_SUBSCRIPTION(tenantId)}?_t=${timestamp}`;

      const doFallbackFromValidate = async (): Promise<boolean> => {
        try {
          const validateUrl = `${ENDPOINTS.HUB_LICENSES_VALIDATE}?tenantId=${tenantId}&_t=${Date.now()}`;
          const validateRes = await fetch(validateUrl, { method: 'GET', cache: 'no-store', headers: { 'Accept': 'application/json' } });
          if (validateRes.ok) {
            const data = await validateRes.json().catch(() => null);
            const planKeyRaw = (data?.license?.planKey || data?.planKey || '').toLowerCase();
            const hasPlan = ['starter', 'pro', 'max'].includes(planKeyRaw);
            if (hasPlan) {
              const mappedPlanInfo: PlanInfo = {
                plano: planKeyRaw as 'starter' | 'pro' | 'max',
                seatLimit: data?.license?.maxSeats || data?.maxSeats || 1,
                recursos: {
                  products: { enabled: true },
                  pdv: { enabled: true },
                  stock: { enabled: true },
                  agenda: { enabled: planKeyRaw !== 'starter' },
                  banho_tosa: { enabled: planKeyRaw !== 'starter' },
                  reports: { enabled: planKeyRaw !== 'starter' },
                },
                ciclo: 'MENSAL',
                proximoCobranca: data?.license?.expiresAt || data?.expiresAt,
              };
              console.log('🎯 Plano via validação de licença (fallback):', mappedPlanInfo);
              setPlanInfo(mappedPlanInfo);
              return true;
            }
          }
          console.warn('⚠️ Validação não retornou plano; tentando plano local do client-local');

          // Fallback final: usar plano do client-local
          try {
            const localPlanRes = await fetch(`${API_URLS.CLIENT_LOCAL}/licensing/plan/current`, { method: 'GET', cache: 'no-store', headers: { 'Accept': 'application/json' } });
            if (localPlanRes.ok) {
              const local = await localPlanRes.json().catch(() => null);
              const planKeyRaw = (local?.planKey || '').toLowerCase();
              if (['starter', 'pro', 'max'].includes(planKeyRaw)) {
                const mappedPlanInfo: PlanInfo = {
                  plano: planKeyRaw as 'starter' | 'pro' | 'max',
                  seatLimit: 1,
                  recursos: {
                    products: { enabled: true },
                    pdv: { enabled: true },
                    stock: { enabled: true },
                    agenda: { enabled: planKeyRaw !== 'starter' },
                    banho_tosa: { enabled: planKeyRaw !== 'starter' },
                    reports: { enabled: planKeyRaw !== 'starter' },
                  },
                  ciclo: 'MENSAL',
                  proximoCobranca: local?.expiresAt,
                };
                console.log('🎯 Plano via client-local (fallback final):', mappedPlanInfo);
                setPlanInfo(mappedPlanInfo);
                return true;
              }
            }
          } catch (e) {
            console.warn('⚠️ Falha ao obter plano do client-local', e);
          }

          console.warn('⚠️ Nenhuma assinatura ativa/validação de licença válida encontrada para o tenant');
          return false;
        } catch (e) {
          console.warn('⚠️ Falha no fallback via validação de licença', e);
          return false;
        }
      };
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'x-tenant-id': tenantId,
          // Enviar cabeçalhos de licença de forma compatível com o LicenseGuard do Hub
          'X-License-Token': licenseToken,
          'Authorization': `Bearer ${licenseToken}`,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Falha ao buscar assinatura (HTTP ${response.status})`);
        await doFallbackFromValidate();
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (response.status === 304 || response.status === 204 || !contentType.includes('application/json')) {
        let preview = '';
        try { preview = await response.text(); } catch {}
        console.info('ℹ️ Assinatura sem corpo/304 ou não-JSON; usando fallback.', { url, contentType, preview: preview?.slice(0, 200) });
        await doFallbackFromValidate();
        return;
      }

      const subscription = await response.json();

      // Se não houver assinatura ativa para o tenant, tentar usar validação de licença como fallback
      if (!subscription) {
        await doFallbackFromValidate();
        return;
      }

      // Mapear dados da assinatura do Hub
      const planKeyFromHub = (subscription?.plan?.name || 'starter').toLowerCase();
      const featuresEnabled = subscription?.plan?.featuresEnabled || {};
      const cycleRaw = (subscription?.billingCycle || 'MONTHLY').toString().toLowerCase();
      const mappedCycle: 'MENSAL' | 'ANUAL' = cycleRaw.includes('year') ? 'ANUAL' : 'MENSAL';

      let mappedPlanInfo: PlanInfo = {
        plano: (['starter', 'pro', 'max'].includes(planKeyFromHub) ? planKeyFromHub : 'starter') as 'starter' | 'pro' | 'max',
        seatLimit: subscription?.plan?.maxSeats || 1,
        recursos: {
          products: { enabled: featuresEnabled.products !== false },
          pdv: { enabled: featuresEnabled.pdv !== false },
          stock: { enabled: featuresEnabled.stock !== false },
          agenda: { enabled: featuresEnabled.agenda !== false },
          banho_tosa: { enabled: featuresEnabled.banho_tosa !== false },
          reports: { enabled: featuresEnabled.reports !== false },
        },
        ciclo: mappedCycle,
        proximoCobranca: subscription?.expiresAt,
      };

      // Reconciliar com licença se houver divergência (plano da licença é o preferido para exibição)
      try {
        const validateUrl = `${ENDPOINTS.HUB_LICENSES_VALIDATE}?tenantId=${tenantId}&_t=${Date.now()}`;
        const validateRes = await fetch(validateUrl, { method: 'GET', cache: 'no-store', headers: { 'Accept': 'application/json' } });
        if (validateRes.ok) {
          const data = await validateRes.json().catch(() => null);
          const licensePlanKey = (data?.license?.planKey || data?.planKey || '').toLowerCase();
          const isValidLicense = data?.valid === true || data?.licensed === true;
          if (isValidLicense && ['starter', 'pro', 'max'].includes(licensePlanKey) && licensePlanKey !== mappedPlanInfo.plano) {
            mappedPlanInfo = {
              ...mappedPlanInfo,
              plano: licensePlanKey as 'starter' | 'pro' | 'max',
              seatLimit: data?.license?.maxSeats || mappedPlanInfo.seatLimit,
              proximoCobranca: data?.license?.expiresAt || mappedPlanInfo.proximoCobranca,
            };
            console.log('🔁 Plano ajustado via licença válida:', mappedPlanInfo.plano);
          }
        }
      } catch (e) {
        console.warn('⚠️ Falha ao validar licença para conciliação de plano', e);
      }

      console.log('🎯 Dados do plano carregados do Hub:', subscription);
      setPlanInfo(mappedPlanInfo);
    } catch (error) {
      console.error('Erro ao carregar plano do Hub:', error);
      // Não lançar erro para não marcar Hub como offline
      return;
    }
  };

  const loadHubPlans = async () => {
    try {
      // Buscar planos diretamente do Hub, sem cache usando timestamp
      const timestamp = new Date().getTime();
      const url = `${ENDPOINTS.HUB_PLANS}?_t=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'GET'
      });
      
      if (response.ok) {
        const plans = await response.json();
        setHubPlans(plans);
        console.log('✅ Planos carregados do Hub:', plans.length);
      } else {
        throw new Error(`Erro ao buscar planos: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar planos do Hub:', error);
      throw error;
    }
  };

  const loadInvoices = async () => {
    try {
      // Buscar faturas diretamente do Hub, sem cache usando timestamp
      const tenantId = localStorage.getItem('2f.tenantId') || 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';
      const timestamp = new Date().getTime();
      const url = `${ENDPOINTS.CLIENT_PLANS_INVOICES(tenantId)}?_t=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const invoices = await response.json();
        setInvoices(invoices);
        console.log('✅ Faturas carregadas do Hub:', invoices.length);
      } else {
        // Faturas são opcionais, não falhar se não encontrar
        console.warn('⚠️ Nenhuma fatura encontrada ou erro ao buscar faturas');
        setInvoices([]);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar faturas do Hub:', error);
      setInvoices([]);
    }
  };

  const handleRefresh = () => {
    checkHubConnectivity();
  };

  const handlePlanUpdate = async (planKey: 'starter' | 'pro' | 'max') => {
    try {
      await updatePlan(planKey);
      toast.success('Plano atualizado com sucesso');
      await loadPlanFromHub(); // Recarregar informações
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
          await loadPlanFromHub(); // Recarregar informações
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
        await loadPlanFromHub();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plano & Faturamento</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua assinatura e histórico de pagamentos</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Verificando conectividade com o Hub...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se o Hub não estiver online, mostrar estado offline
  if (hubConnectivityChecked && !isHubOnline) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plano & Faturamento</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua assinatura e histórico de pagamentos</p>
        </div>

        <Alert className="border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Sistema Offline</AlertTitle>
          <AlertDescription className="text-orange-700">
            Não foi possível conectar ao Hub para carregar os dados de planos e faturamento.
            <br />
            <strong>Para acessar esta funcionalidade:</strong>
            <br />
            1. Verifique sua conexão com a internet
            <br />
            2. Certifique-se de que o Hub está rodando
            <br />
            3. Clique no botão "Tentar Novamente" abaixo
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Funcionalidade Indisponível</h3>
              <p className="text-muted-foreground max-w-md">
                Esta aba requer conexão com o Hub para carregar dados atualizados sem cache.
                Conecte-se à internet e tente novamente.
              </p>
            </div>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não temos dados do plano mesmo com Hub online
  if (!planInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Plano & Faturamento</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua assinatura e histórico de pagamentos</p>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <X className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erro ao Carregar Dados</AlertTitle>
          <AlertDescription className="text-red-700">
            Não foi possível carregar as informações do seu plano atual.
            Tente novamente ou entre em contato com o suporte.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <X className="h-16 w-16 text-red-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Dados Indisponíveis</h3>
              <p className="text-muted-foreground max-w-md">
                Não foi possível carregar as informações do seu plano.
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allPlans = getAllPlans();
  const currentPlanData = allPlans.find(p => p.id === planInfo.plano);
  // Tentar pegar o nome do plano diretamente do Hub se disponível
  const currentHubPlan = hubPlans.find(p => 
    p.id === planInfo.plano || 
    p.name.toLowerCase() === planInfo.plano.toLowerCase()
  );
  const displayPlanName = currentHubPlan?.name || currentPlanData?.name || planInfo.plano;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plano & Faturamento</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua assinatura e histórico de pagamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            Hub Online
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
          <CardDescription>
            {displayPlanName} • {planInfo.ciclo}
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
            
            console.log(`🔍 Checking plan ${plan.id} (${plan.name}):`, {
              planId: plan.id,
              planName: plan.name,
              planInfoPlano: planInfo?.plano,
              idMatch: plan.id === planInfo?.plano,
              nameMatch: plan.name.toLowerCase() === planInfo?.plano.toLowerCase(),
              isCurrentPlan
            });
            
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
