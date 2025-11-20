import Header from '../components/Header'
import Footer from '../components/Footer'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare,
  Send
} from 'lucide-react'

const ContactPage = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'contato@fflowsuite.com',
      description: 'Resposta em até 24 horas'
    },
    {
      icon: Phone,
      title: 'Telefone',
      value: '+55 (11) 9999-9999',
      description: 'Seg a Sex, 8h às 18h'
    },
    {
      icon: MapPin,
      title: 'Endereço',
      value: 'São Paulo, SP - Brasil',
      description: 'Atendimento presencial com agendamento'
    },
    {
      icon: Clock,
      title: 'Horário de Atendimento',
      value: 'Segunda a Sexta',
      description: '8:00 às 18:00'
    }
  ]

  const supportTypes = [
    {
      icon: MessageSquare,
      title: 'Suporte Técnico',
      description: 'Problemas com instalação, configuração ou uso do sistema',
      email: 'suporte@fflowsuite.com'
    },
    {
      icon: Mail,
      title: 'Vendas',
      description: 'Informações sobre planos, preços e licenças',
      email: 'vendas@fflowsuite.com'
    },
    {
      icon: Phone,
      title: 'Comercial',
      description: 'Parcerias, integrações e soluções personalizadas',
      email: 'comercial@fflowsuite.com'
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
              Entre em Contato
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Estamos aqui para ajudar você. Entre em contato para suporte técnico, 
              informações comerciais ou qualquer dúvida. A 2F Solutions atende você.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {info.title}
                </h3>
                <p className="text-primary-600 font-medium mb-1">
                  {info.value}
                </p>
                <p className="text-sm text-gray-600">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Support Types */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Envie uma Mensagem
              </h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Seu sobrenome"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Assunto
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="suporte">Suporte Técnico</option>
                    <option value="vendas">Informações de Vendas</option>
                    <option value="comercial">Comercial/Parcerias</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Descreva sua dúvida ou necessidade..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </button>
              </form>
            </div>

            {/* Support Types */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tipos de Suporte
              </h2>
              
              <div className="space-y-6">
                {supportTypes.map((type, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-start">
                      <div className="bg-primary-100 p-3 rounded-lg mr-4">
                        <type.icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {type.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {type.description}
                        </p>
                        <a
                          href={`mailto:${type.email}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {type.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ Link */}
              <div className="mt-8 bg-primary-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Perguntas Frequentes
                </h3>
                <p className="text-gray-600 mb-4">
                  Antes de entrar em contato, verifique se sua dúvida já foi respondida em nossa seção de FAQ.
                </p>
                <a
                  href="/docs#faq"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver FAQ →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-16 bg-red-50 border-t border-red-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Suporte de Emergência
            </h2>
            <p className="text-gray-600 mb-6">
              Para problemas críticos que impedem o funcionamento do seu negócio, 
              entre em contato através do nosso suporte de emergência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+5511999999999"
                className="bg-red-600 text-white hover:bg-red-700 px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Ligar Agora: (11) 9999-9999
              </a>
              <a
                href="mailto:emergencia@fflowsuite.com"
                className="bg-white text-red-600 border border-red-600 hover:bg-red-50 px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Email de Emergência
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Disponível 24/7 para clientes com plano Enterprise
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default ContactPage