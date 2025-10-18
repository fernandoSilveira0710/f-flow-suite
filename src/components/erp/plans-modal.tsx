import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ENDPOINTS } from '@/lib/env';
import { useAuth } from '@/contexts/auth-context';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  popular?: boolean;
  maxSeats: number;
}

interface PlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanSelected: (planKey: string) => void;
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para pequenos negócios',
    price: 97,
    maxSeats: 1,
    features: [
      'PDV Básico',
      'Gestão de Estoque',
      'Cadastro de Clientes',
      'Cadastro de Pets',
      'Serviços Básicos',
      'Suporte por Email'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para negócios em crescimento',
    price: 197,
    maxSeats: 5,
    popular: true,
    features: [
      'Tudo do Starter',
      'Agenda Avançada',
      'Gestão de Profissionais',
      'Relatórios Detalhados',
      'Dashboard Analítico',
      'Integração WhatsApp',
      'Suporte Prioritário'
    ]
  },
  {
    id: 'max',
    name: 'Max',
    description: 'Para empresas estabelecidas',
    price: 297,
    maxSeats: 15,
    features: [
      'Tudo do Pro',
      'Multi-lojas',
      'API Avançada',
      'Relatórios Personalizados',
      'Backup Automático',
      'Suporte Premium 24/7',
      'Treinamento Personalizado'
    ]
  }
];

export function PlansModal({ open, onOpenChange, onPlanSelected }: PlansModalProps) {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { refreshLicenseStatus } = useAuth();

  useEffect(() => {
    if (open) {
      loadPlansFromHub();
    }
  }, [open]);

  const loadPlansFromHub = async () => {
    try {
      const response = await fetch(ENDPOINTS.HUB_PLANS);
      if (response.ok) {
        const hubPlans = await response.json();
        
        // Mapear planos do Hub para o formato esperado
        const mappedPlans = hubPlans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description || `Plano ${plan.name}`,
          price: plan.price || 0,
          maxSeats: plan.maxSeats || 1,
          features: plan.features || [],
          popular: plan.name.toLowerCase() === 'pro'
        }));
        
        setPlans(mappedPlans.length > 0 ? mappedPlans : FALLBACK_PLANS);
      }
    } catch (error) {
      console.warn('Erro ao carregar planos do Hub, usando planos padrão:', error);
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(planId);
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const userId = localStorage.getItem('user_id') || 'unknown';
      
      if (!tenantId) {
        throw new Error('Tenant ID não encontrado');
      }

      // Usar PlanSyncService para sincronização completa
      const { PlanSyncService } = await import('../../services/plan-sync.service');
      const result = await PlanSyncService.syncPlansAfterPlanChange(tenantId, userId, planId);

      if (result.success) {
        // Forçar atualização do status da licença
        console.log('🔄 Atualizando status da licença...');
        await refreshLicenseStatus();

        toast({
          title: "Plano ativado com sucesso!",
          description: `Seu plano ${planId} foi ativado e sincronizado em todos os serviços.`,
        });

        setSelectedPlan(planId);
        onPlanSelected?.(planId);
        onOpenChange(false);
      } else {
        // Sincronização parcial - ainda assim considerar sucesso
        console.log('🔄 Atualizando status da licença...');
        await refreshLicenseStatus();

        toast({
          title: "Plano ativado com avisos",
          description: `Plano ${planId} ativado, mas alguns serviços podem não estar sincronizados.`,
          variant: "default"
        });

        setSelectedPlan(planId);
        onPlanSelected?.(planId);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao ativar plano:', error);
      
      toast({
        title: "Erro ao ativar plano",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="h-5 w-5" />;
      case 'pro':
        return <Star className="h-5 w-5" />;
      case 'max':
        return <Crown className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Selecione seu Plano
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Sua licença expirou ou não foi encontrada. Escolha um plano para continuar usando o F-Flow Suite.
          </DialogDescription>
        </DialogHeader>

        {loadingPlans ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 mt-6">
            {plans.map((plan) => {
              const isPopular = plan.popular;
              const isPlanLoading = isLoading === plan.id;

              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all duration-200 hover:shadow-lg ${
                    isPopular ? 'border-primary shadow-md scale-105' : ''
                  }`}
                >
                  {isPopular && (
                    <Badge 
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary"
                    >
                      Mais Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {getPlanIcon(plan.id)}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">R$ {plan.price}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Até {plan.maxSeats} {plan.maxSeats === 1 ? 'usuário' : 'usuários'}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full py-6 text-lg font-semibold transition-all duration-200 ${
                        isPopular ? 'bg-primary hover:bg-primary/90 shadow-lg' : ''
                      }`}
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isPlanLoading}
                    >
                      {isPlanLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Ativando...
                        </div>
                      ) : (
                        `Ativar ${plan.name}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            ✅ Ativação imediata • ✅ Sem fidelidade • ✅ Suporte incluído
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}