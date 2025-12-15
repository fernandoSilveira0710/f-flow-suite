import Header from '../components/Header'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Smartphone,
  FileText,
  Shield,
  Wifi
} from 'lucide-react'

const FeaturesPage = () => {
  const mainFeatures = [
    {
      icon: ShoppingCart,
      title: 'PDV Básico',
      description: 'Ponto de venda simples para operações diárias do seu comércio',
      features: [
        'Interface amigável',
        'Itens e totais claros',
        'Suporte a múltiplos usuários (por licença)',
        'Operação local e offline',
        'Fluxo de venda direto'
      ]
    },
    {
      icon: Package,
      title: 'Gestão de Estoque',
      description: 'Controle de produtos com entradas e saídas',
      features: [
        'Cadastro de produtos',
        'Movimentação de estoque',
        'Alertas de estoque baixo',
        'Organização por categorias',
        'Atributos essenciais (SKU, preço, etc.)'
      ]
    },
    {
      icon: Package,
      title: 'Produtos e Categorias',
      description: 'Estruture seu catálogo de forma simples',
      features: [
        'Cadastro de categorias',
        'Vinculação de produtos',
        'Busca rápida',
        'Edição e atualização simples',
        'Compatível com operação offline'
      ]
    },
    {
      icon: Users,
      title: 'Clientes (Básico)',
      description: 'Cadastro simples de clientes para vendas e histórico básico',
      features: [
        'Dados essenciais (nome, contato)',
        'Associação a vendas',
        'Consulta rápida',
        'Sem CRM avançado',
        'Expansões futuras planejadas'
      ]
    }
  ]

  const additionalFeatures = [
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Sistema opera sem internet após a instalação'
    },
    {
      icon: Shield,
      title: 'Segurança de Dados',
      description: 'Dados locais com controle de acesso por usuário'
    },
    {
      icon: Smartphone,
      title: 'Interface Moderna',
      description: 'Interface responsiva e agradável no uso cotidiano'
    },
    {
      icon: FileText,
      title: 'Instalação Simples',
      description: 'Guia claro e instalação descomplicada'
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
              Recursos para Comércios
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Descubra as funcionalidades essenciais da 2F Solutions para a gestão 
              do seu comércio.
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
              Teste gratuitamente por 30 dias e veja como a 2F Solutions 
              pode transformar seu negócio.
            </p>
            <div className="mt-8">
              <Link
                to="/precos"
                className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 rounded-md font-semibold text-lg transition-colors"
              >
                Começar Teste Gratuito
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default FeaturesPage