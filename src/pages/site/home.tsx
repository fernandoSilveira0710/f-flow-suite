import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { FeatureCard } from '@/components/site/feature-card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  BarChart3, 
  ShoppingCart, 
  Warehouse, 
  Calendar, 
  Scissors,
  ArrowRight,
  Check 
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Package,
      title: 'Gestão de Produtos',
      description: 'Cadastro completo com categorias, variações e controle de estoque em tempo real.',
    },
    {
      icon: ShoppingCart,
      title: 'PDV Completo',
      description: 'Sistema de ponto de venda rápido e intuitivo para agilizar suas vendas.',
    },
    {
      icon: Warehouse,
      title: 'Controle de Estoque',
      description: 'Gerencie entradas, saídas e inventário de forma simples e eficiente.',
    },
    {
      icon: Calendar,
      title: 'Agenda de Serviços',
      description: 'Organize agendamentos, equipe e horários em um calendário integrado.',
    },
    {
      icon: Scissors,
      title: 'Banho & Tosa',
      description: 'Módulo especializado para pet shops com gestão de tutores, pets e serviços.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Avançados',
      description: 'Visualize o desempenho do seu negócio com relatórios completos e exportáveis.',
    },
  ];

  const benefits = [
    'Interface moderna e intuitiva',
    'Acesso de qualquer dispositivo',
    'Suporte especializado',
    'Atualizações automáticas',
    'Dados sempre seguros',
    'Multi-usuário',
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-primary text-primary-foreground py-20 md:py-32">
          <div className="container-2f">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Gestão Completa para o Seu Comércio
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Sistema integrado com tudo que você precisa: produtos, vendas, estoque, 
                agenda e muito mais em uma única plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/cadastro">
                    Experimentar Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20" asChild>
                  <Link to="/planos">Ver Planos</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container-2f">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tudo em um Só Lugar
              </h2>
              <p className="text-lg text-muted-foreground">
                Módulos integrados para gerenciar todas as áreas do seu negócio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container-2f">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Por Que Escolher a 2F Solutions?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Desenvolvido por Fernando e Fillipe, nossa plataforma oferece 
                  a melhor experiência em gestão comercial.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="card-elevated p-8 bg-card">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">+50%</p>
                        <p className="text-sm text-muted-foreground">Aumento em Produtividade</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">-30%</p>
                        <p className="text-sm text-muted-foreground">Redução de Erros</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">24/7</p>
                        <p className="text-sm text-muted-foreground">Disponibilidade</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container-2f">
            <div className="card-elevated p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para Transformar Seu Negócio?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Comece agora com 14 dias grátis. Não é necessário cartão de crédito.
              </p>
              <Button size="lg" asChild>
                <Link to="/cadastro">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
