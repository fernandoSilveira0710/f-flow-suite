import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { getAllPlans, setPlan, PlanType } from '@/lib/entitlements';
import { updatePlan } from '@/lib/settings-api';
import { toast } from '@/hooks/use-toast';

export default function Planos() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const plans = getAllPlans();

  const handleSelectPlan = async (planKey: 'starter' | 'pro' | 'max') => {
    setIsLoading(planKey);
    
    try {
      await updatePlan(planKey);
      
      // Aguardar um pouco para garantir que a atualização foi processada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para o ERP
      window.location.href = '/erp';
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      // Mesmo com erro, redirecionar (fallback para localStorage)
      window.location.href = '/erp';
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1 py-20">
        <div className="container-2f">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Escolha o Plano Ideal
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Planos flexíveis para negócios de todos os tamanhos
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Anual
                <span className="ml-2 text-xs text-secondary font-semibold">
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.price : plan.priceAnnual / 12;
              const isPro = plan.id === 'pro';

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    isPro ? 'border-primary shadow-xl scale-105' : ''
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        MAIS POPULAR
                      </span>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        R$ {price.toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </CardDescription>
                    {billingCycle === 'annual' && (
                      <p className="text-xs text-muted-foreground">
                        R$ {plan.priceAnnual} cobrado anualmente
                      </p>
                    )}
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPro ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isLoading === plan.id}
                    >
                      {isLoading === plan.id ? 'Processando...' : `Assinar ${plan.name}`}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Button variant="ghost" asChild>
              <Link to="/erp/dashboard">Ir ao Painel</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
