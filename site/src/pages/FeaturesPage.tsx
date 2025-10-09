import Header from '../components/Header'
import Footer from '../components/Footer'
import { 
  Calendar, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Package, 
  Smartphone,
  Clock,
  Bell,
  CreditCard,
  FileText,
  Shield,
  Wifi
} from 'lucide-react'

const FeaturesPage = () => {
  const mainFeatures = [
    {
      icon: Calendar,
      title: 'Sistema de Agendamento',
      description: 'Gerencie todos os agendamentos do seu pet shop de forma inteligente',
      features: [
        'Calendário visual intuitivo',
        'Notificações automáticas por SMS/Email',
        'Controle de disponibilidade por profissional',
        'Reagendamento fácil',
        'Histórico completo de agendamentos'
      ]
    },
    {
      icon: ShoppingCart,
      title: 'PDV Completo',
      description: 'Ponto de venda integrado com todas as funcionalidades necessárias',
      features: [
        'Interface touch-friendly',
        'Leitor de código de barras',
        'Múltiplas formas de pagamento',
        'Impressão de cupons fiscais',
        'Controle de caixa e sangria'
      ]
    },
    {
      icon: Package,
      title: 'Gestão de Estoque',
      description: 'Controle total do seu estoque com alertas inteligentes',
      features: [
        'Controle de entrada e saída',
        'Alertas de estoque baixo',
        'Relatórios de movimentação',
        'Controle de validade',
        'Inventário automático'
      ]
    },
    {
      icon: Users,
      title: 'CRM de Clientes',
      description: 'Gerencie clientes e pets com histórico completo',
      features: [
        'Cadastro completo de clientes e pets',
        'Histórico de atendimentos',
        'Preferências e observações',
        'Aniversários e lembretes',
        'Programa de fidelidade'
      ]
    }
  ]

  const additionalFeatures = [
    {
      icon: BarChart3,
      title: 'Relatórios Avançados',
      description: 'Dashboard com métricas importantes e relatórios personalizáveis'
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Sistema de notificações automáticas para clientes e equipe'
    },
    {
      icon: CreditCard,
      title: 'Controle Financeiro',
      description: 'Gestão completa de receitas, despesas e fluxo de caixa'
    },
    {
      icon: FileText,
      title: 'Documentos',
      description: 'Geração automática de orçamentos, contratos e recibos'
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Backup automático e controle de acesso por usuário'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Sistema funciona sem internet após a instalação'
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Recursos Completos
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Descubra todas as funcionalidades que fazem do F-Flow Suite a melhor 
              escolha para a gestão do seu pet shop.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {mainFeatures.map((feature, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}>
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center mb-4">
                    <div className="bg-primary-100 p-3 rounded-lg mr-4">
                      <feature.icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {feature.title}
                    </h2>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`bg-gray-100 rounded-lg p-8 ${
                  index % 2 === 1 ? 'lg:col-start-1' : ''
                }`}>
                  <div className="aspect-video bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <feature.icon className="h-16 w-16 text-primary-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              E muito mais...
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Recursos adicionais que fazem a diferença no dia a dia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Pronto para experimentar?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Teste gratuitamente por 30 dias e veja como o F-Flow Suite 
              pode transformar seu negócio.
            </p>
            <div className="mt-8">
              <a
                href="http://localhost:5173/planos"
                target="_blank"
                rel="noopener noreferrer"
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

export default FeaturesPage