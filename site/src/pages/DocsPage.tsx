import Header from '../components/Header'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { 
  Book, 
  Download, 
  Settings, 
  HelpCircle, 
  FileText, 
  Video,
  ArrowRight
} from 'lucide-react'

const DocsPage = () => {
  const docSections = [
    {
      icon: Download,
      title: 'Instalação',
      description: 'Guia completo para instalar o F-Flow Suite no seu computador',
      link: '/docs/instalacao',
      items: [
        'Requisitos do sistema',
        'Download e instalação',
        'Ativação da licença',
        'Solução de problemas'
      ]
    },
    {
      icon: Settings,
      title: 'Configuração Inicial',
      description: 'Como configurar o sistema após a instalação',
      link: '#configuracao',
      items: [
        'Dados da empresa',
        'Usuários e permissões',
        'Configurações gerais',
        'Backup automático'
      ]
    },
    {
      icon: Book,
      title: 'Manual do Usuário',
      description: 'Aprenda a usar todas as funcionalidades do sistema',
      link: '#manual',
      items: [
        'Cadastro de clientes',
        'Agendamentos',
        'Ponto de venda',
        'Relatórios'
      ]
    },
    {
      icon: HelpCircle,
      title: 'FAQ',
      description: 'Respostas para as perguntas mais frequentes',
      link: '#faq',
      items: [
        'Problemas comuns',
        'Dicas de uso',
        'Melhores práticas',
        'Troubleshooting'
      ]
    }
  ]

  const quickLinks = [
    {
      title: 'Guia de Instalação',
      description: 'Instale o sistema em poucos minutos',
      link: '/docs/instalacao',
      icon: Download
    },
    {
      title: 'Vídeo Tutorial',
      description: 'Assista ao tutorial completo',
      link: '#video',
      icon: Video
    },
    {
      title: 'Suporte Técnico',
      description: 'Entre em contato conosco',
      link: '/contato',
      icon: HelpCircle
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
              Documentação
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa saber para usar o F-Flow Suite de forma eficiente. 
              Guias, tutoriais e documentação completa.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Links Rápidos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={link.link}
                className="bg-gray-50 hover:bg-gray-100 p-6 rounded-lg border border-gray-200 transition-colors group"
              >
                <div className="flex items-center mb-3">
                  <div className="bg-primary-100 p-2 rounded-lg mr-3">
                    <link.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                    {link.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {docSections.map((section, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-lg mr-4">
                    <section.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {section.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to={section.link}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver documentação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Primeiros Passos
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Siga este roteiro para começar a usar o F-Flow Suite
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Adquira sua Licença
                </h3>
                <p className="text-gray-600">
                  Escolha o plano ideal e adquira sua licença através do nosso site.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Instale o Sistema
                </h3>
                <p className="text-gray-600">
                  Baixe e instale o F-Flow Suite seguindo nosso guia de instalação.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configure o Sistema
                </h3>
                <p className="text-gray-600">
                  Configure os dados da sua empresa, usuários e preferências básicas.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Comece a Usar
                </h3>
                <p className="text-gray-600">
                  Cadastre seus primeiros clientes e comece a agendar atendimentos.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/docs/instalacao"
              className="btn-primary px-8 py-3"
            >
              Começar Instalação
            </Link>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Precisa de Ajuda?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Nossa equipe de suporte está pronta para ajudar você
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contato"
                className="bg-white text-primary-600 hover:bg-gray-50 px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Contatar Suporte
              </Link>
              <a
                href="mailto:suporte@fflowsuite.com"
                className="bg-primary-700 text-white hover:bg-primary-800 px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Enviar Email
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default DocsPage