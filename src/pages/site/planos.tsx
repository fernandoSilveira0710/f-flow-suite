import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Shield, Zap, HeadphonesIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllPlans, setPlan, PlanType } from '@/lib/entitlements';
import { updatePlan } from '@/lib/settings-api';
import { toast } from '@/hooks/use-toast';

export default function Planos() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
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

  const benefits = [
    {
      icon: Zap,
      title: "Implementação Rápida",
      description: "Configure seu sistema em minutos, não em semanas"
    },
    {
      icon: Shield,
      title: "Dados Seguros",
      description: "Criptografia de ponta e backups automáticos"
    },
    {
      icon: Users,
      title: "Suporte Especializado",
      description: "Equipe dedicada para ajudar seu negócio crescer"
    },
    {
      icon: HeadphonesIcon,
      title: "Treinamento Incluído",
      description: "Capacitação completa para sua equipe"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      business: "Pet Shop Amor & Carinho",
      content: "Aumentamos nossa produtividade em 40% após implementar o F-Flow Suite. O sistema é intuitivo e completo.",
      rating: 5
    },
    {
      name: "João Santos",
      business: "Clínica Veterinária Vida Animal",
      content: "O melhor investimento que fizemos. O controle de agenda e estoque ficou muito mais eficiente.",
      rating: 5
    },
    {
      name: "Ana Costa",
      business: "Grooming Premium",
      content: "Interface moderna e funcionalidades que realmente fazem diferença no dia a dia. Recomendo!",
      rating: 5
    }
  ];

  const faqItems = [
    {
      question: "Posso mudar de plano a qualquer momento?",
      answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações são aplicadas imediatamente."
    },
    {
      question: "Os dados ficam seguros na nuvem?",
      answer: "Absolutamente. Utilizamos criptografia de ponta e servidores seguros. Seus dados são protegidos com os mais altos padrões de segurança."
    },
    {
      question: "Há período de teste gratuito?",
      answer: "Sim! Todos os planos incluem 14 dias de teste gratuito. Você pode explorar todas as funcionalidades sem compromisso."
    },
    {
      question: "Preciso de conhecimento técnico para usar?",
      answer: "Não! O F-Flow Suite foi desenvolvido para ser intuitivo. Além disso, oferecemos treinamento completo e suporte especializado."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, não há fidelidade. Você pode cancelar sua assinatura a qualquer momento através do painel de configurações."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container-2f">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4">
                ✨ Mais de 1.000 empresas confiam em nós
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Escolha o Plano Ideal para seu Negócio
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Planos flexíveis que crescem com sua empresa. Comece grátis e escale conforme sua necessidade.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg mb-8">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 rounded-md transition-all duration-200 ${
                    billingCycle === 'monthly'
                      ? 'bg-background shadow-sm font-medium'
                      : 'hover:bg-background/50'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-3 rounded-md transition-all duration-200 ${
                    billingCycle === 'annual'
                      ? 'bg-background shadow-sm font-medium'
                      : 'hover:bg-background/50'
                  }`}
                >
                  Anual
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    Economize 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
              {plans.map((plan) => {
                const price = billingCycle === 'monthly' ? plan.price : plan.priceAnnual / 12;
                const isPro = plan.id === 'pro';
                const isMax = plan.id === 'max';

                return (
                  <Card
                    key={plan.id}
                    className={`relative transition-all duration-300 hover:shadow-xl ${
                      isPro ? 'border-primary shadow-xl scale-105 bg-gradient-to-b from-primary/5 to-background' : 
                      isMax ? 'border-secondary shadow-lg' : ''
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                          🔥 MAIS POPULAR
                        </span>
                      </div>
                    )}

                    {isMax && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <span className="bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                          ⚡ MÁXIMO PODER
                        </span>
                      </div>
                    )}

                    <CardHeader className="pb-8">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-foreground">
                            R$ {price.toFixed(0)}
                          </span>
                          <span className="text-muted-foreground text-lg">/mês</span>
                        </div>
                        {billingCycle === 'annual' && (
                          <p className="text-sm text-muted-foreground mt-2">
                            R$ {plan.priceAnnual} cobrado anualmente
                          </p>
                        )}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-8">
                      <ul className="space-y-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      <Button
                        className={`w-full py-6 text-lg font-semibold transition-all duration-200 ${
                          isPro ? 'bg-primary hover:bg-primary/90 shadow-lg' :
                          isMax ? 'bg-secondary hover:bg-secondary/90' : ''
                        }`}
                        variant={isPro ? 'default' : isMax ? 'secondary' : 'outline'}
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isLoading === plan.id}
                      >
                        {isLoading === plan.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Processando...
                          </div>
                        ) : (
                          `Começar com ${plan.name}`
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                ✅ 14 dias grátis • ✅ Sem fidelidade • ✅ Suporte incluído
              </p>
              <Button variant="ghost" asChild className="text-lg">
                <Link to="/erp/dashboard">Já tenho uma conta →</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container-2f">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Por que escolher o F-Flow Suite?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Mais que um sistema, uma solução completa para transformar seu negócio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container-2f">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O que nossos clientes dizem
              </h2>
              <p className="text-xl text-muted-foreground">
                Histórias reais de sucesso com o F-Flow Suite
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="container-2f">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-xl text-muted-foreground">
                Tire suas dúvidas sobre nossos planos
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index} className="overflow-hidden">
                  <button
                    className="w-full p-6 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg pr-4">{item.question}</h3>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="container-2f text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Junte-se a mais de 1.000 empresas que já escolheram o F-Flow Suite para crescer
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
                <Link to="/cadastro">Começar Teste Grátis</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link to="/contato">Falar com Especialista</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
