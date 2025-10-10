import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Check, Star } from 'lucide-react'

interface HubPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  maxSeats: number;
  maxDevices: number;
  featuresEnabled: string; // JSON string
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const PricingPage = () => {
  const [hubPlans, setHubPlans] = useState<HubPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback plans (hardcoded) - ajustados para o formato HubPlan
  const fallbackPlans: HubPlan[] = [
    {
      id: 'starter',
      name: 'Básico',
      price: 19.99,
      currency: 'BRL',
      description: 'Ideal para pet shops pequenos',
      maxSeats: 2,
      maxDevices: 1,
      featuresEnabled: JSON.stringify([
        'Até 2 usuários',
        'Agendamento básico',
        'PDV simples',
        'Controle de estoque',
        'Relatórios básicos',
        'Suporte por email'
      ]),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 59.99,
      currency: 'BRL',
      description: 'Para pet shops em crescimento',
      maxSeats: 5,
      maxDevices: 2,
      featuresEnabled: JSON.stringify([
        'Até 5 usuários',
        'Agendamento avançado',
        'PDV completo',
        'Gestão de estoque avançada',
        'CRM completo',
        'Relatórios avançados',
        'Notificações automáticas',
        'Suporte prioritário'
      ]),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'max',
      name: 'Enterprise',
      price: 99.99,
      currency: 'BRL',
      description: 'Para grandes operações',
      maxSeats: 15,
      maxDevices: 5,
      featuresEnabled: JSON.stringify([
        'Usuários ilimitados',
        'Todos os recursos',
        'Multi-loja',
        'API personalizada',
        'Relatórios personalizados',
        'Treinamento incluído',
        'Suporte 24/7',
        'Gerente de conta dedicado'
      ]),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadPlansFromHub();
  }, []);

  const loadPlansFromHub = async () => {
    setLoading(true);
    try {
      // Buscar planos da API pública do Hub
      const response = await fetch(`${import.meta.env.VITE_HUB_API_URL}/public/plans?active=true`);
      if (response.ok) {
        const plans = await response.json();
        setHubPlans(plans);
      } else {
        console.warn('Falha ao buscar planos do Hub, usando planos locais');
        setHubPlans(fallbackPlans);
      }
    } catch (error) {
      console.error('Erro ao buscar planos do Hub:', error);
      // Fallback para planos locais
      setHubPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  };

  // Mapear planos do Hub para formato da página
  const mapHubPlanToDisplay = (plan: HubPlan) => {
    let popular = false;
    let cta = 'Começar Teste';

    // Mapear baseado no preço ou nome
    if (plan.price <= 20) {
      popular = false;
    } else if (plan.price <= 60) {
      popular = true;
    } else {
      cta = 'Falar com Vendas';
    }

    // Parse features from JSON string
    let features: string[] = [];
    try {
      features = JSON.parse(plan.featuresEnabled);
    } catch (error) {
      console.error('Error parsing features:', error);
      features = ['Recursos disponíveis'];
    }

    return {
      id: plan.id,
      name: plan.name,
      price: `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
      period: '/mês',
      description: plan.description,
      features: features,
      popular,
      cta
    };
  };

  const displayPlans = (hubPlans && hubPlans.length > 0) 
    ? hubPlans.map(mapHubPlanToDisplay) 
    : fallbackPlans.map(mapHubPlanToDisplay);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Planos e Preços
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Escolha o plano ideal para o seu negócio. Todos os planos incluem 
              30 dias de teste gratuito.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayPlans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${
                  plan.popular 
                    ? 'border-primary-500 scale-105' 
                    : 'border-gray-200'
                } p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Mais Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <a
                    href={plan.cta === 'Começar Teste' ? '/cadastro' : '/contato'}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors inline-block ${
                      plan.popular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Como funciona o teste gratuito?
              </h3>
              <p className="text-gray-600">
                Você pode usar o sistema por 30 dias sem nenhum custo. 
                Não é necessário cartão de crédito para começar.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso mudar de plano depois?
              </h3>
              <p className="text-gray-600">
                Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                As mudanças são aplicadas no próximo ciclo de cobrança.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O sistema funciona offline?
              </h3>
              <p className="text-gray-600">
                Sim, após a instalação o sistema funciona completamente offline. 
                Internet é necessária apenas para atualizações e ativação inicial.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Há taxa de setup ou instalação?
              </h3>
              <p className="text-gray-600">
                Não, não cobramos nenhuma taxa adicional. O preço mensal inclui 
                instalação, suporte e todas as atualizações.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Como funciona o suporte?
              </h3>
              <p className="text-gray-600">
                Oferecemos suporte por email, WhatsApp e telefone. O tempo de resposta 
                varia conforme o plano escolhido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Pronto para começar?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Experimente gratuitamente por 30 dias. Sem compromisso, sem cartão de crédito.
            </p>
            <div className="mt-8">
              <a
                href="/cadastro"
                className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 rounded-md font-semibold text-lg transition-colors"
              >
                Começar Teste Gratuito
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default PricingPage