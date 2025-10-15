import Header from '../components/Header'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Package, 
  Smartphone,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Agendamento Inteligente',
      description: 'Sistema completo de agendamentos com notificações automáticas e gestão de horários.'
    },
    {
      icon: ShoppingCart,
      title: 'PDV Integrado',
      description: 'Ponto de venda completo com controle de estoque e relatórios de vendas em tempo real.'
    },
    {
      icon: Package,
      title: 'Gestão de Estoque',
      description: 'Controle total do seu estoque com alertas de produtos em falta e relatórios detalhados.'
    },
    {
      icon: Users,
      title: 'CRM Completo',
      description: 'Gerencie clientes e pets com histórico completo de atendimentos e preferências.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Avançados',
      description: 'Dashboard com métricas importantes e relatórios personalizáveis para seu negócio.'
    },
    {
      icon: Smartphone,
      title: 'Acesso Mobile',
      description: 'Interface responsiva que funciona perfeitamente em qualquer dispositivo.'
    }
  ]

  const benefits = [
    'Instalação local - seus dados ficam seguros no seu computador',
    'Funciona offline - não depende de internet para operar',
    'Interface moderna e intuitiva',
    'Suporte técnico especializado',
    'Atualizações automáticas',
    'Backup automático dos dados'
  ]

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Sistema Completo para
              <span className="text-primary-600"> Pet Shops</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Gerencie agendamentos, vendas, estoque e clientes em uma única plataforma. 
              Solução completa e offline para o seu negócio crescer.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href={`${import.meta.env.VITE_SITE_URL}/planos`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-8 py-3 text-lg"
              >
                Começar Agora
              </a>
              <Link
                to="/recursos"
                className="btn-outline px-8 py-3 text-lg"
              >
                Ver Recursos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Recursos completos para modernizar a gestão do seu pet shop
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-6">
                Por que escolher o F-Flow Suite?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Pronto para começar?
              </h3>
              <p className="text-gray-600 mb-6">
                Experimente gratuitamente por 30 dias e veja como o F-Flow Suite 
                pode transformar a gestão do seu pet shop.
              </p>
              <div className="space-y-4">
                <a
                  href={`${import.meta.env.VITE_SITE_URL}/planos`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full text-center py-3"
                >
                  Começar Teste Gratuito
                </a>
                <Link
                  to="/docs/instalacao"
                  className="btn-outline w-full text-center py-3"
                >
                  Ver Guia de Instalação
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HomePage