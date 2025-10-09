import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Check, Package2, ArrowLeft } from 'lucide-react'

const SignupPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedPlan = searchParams.get('plan') || 'basico'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    plan: selectedPlan
  })

  const plans = {
    basico: {
      name: 'Básico',
      price: 'R$ 19,99',
      period: '/mês',
      features: [
        'Até 2 usuários',
        'Agendamento básico',
        'PDV simples',
        'Controle de estoque',
        'Relatórios básicos',
        'Suporte por email'
      ]
    },
    profissional: {
      name: 'Profissional',
      price: 'R$ 59,99',
      period: '/mês',
      features: [
        'Até 5 usuários',
        'Agendamento avançado',
        'PDV completo',
        'Gestão de estoque avançada',
        'CRM completo',
        'Relatórios avançados',
        'Notificações automáticas',
        'Suporte prioritário'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 'R$ 99,99',
      period: '/mês',
      features: [
        'Usuários ilimitados',
        'Todos os recursos',
        'Multi-loja',
        'API personalizada',
        'Relatórios personalizados',
        'Treinamento incluído',
        'Suporte 24/7',
        'Gerente de conta dedicado'
      ]
    }
  }

  const currentPlan = plans[formData.plan as keyof typeof plans]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simular envio do formulário
    console.log('Dados do cadastro:', formData)
    
    // Redirecionar para uma página de sucesso ou próximo passo
    alert('Cadastro realizado com sucesso! Em breve você receberá um email com as instruções para download e ativação.')
    
    // Opcional: redirecionar para página de download ou instruções
    navigate('/docs/instalacao')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <button
              onClick={() => navigate('/planos')}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos planos
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Comece seu Teste Gratuito
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Preencha os dados abaixo para iniciar seu teste gratuito de 30 dias.
              Sem compromisso, sem cartão de crédito.
            </p>
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Form */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center mr-4">
                    <Package2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Criar Conta</h2>
                    <p className="text-gray-600">Comece sua experiência com a 2F Solutions</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Nome do seu pet shop"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">
                      Plano Selecionado
                    </label>
                    <select
                      id="plan"
                      name="plan"
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="basico">Básico - R$ 19,99/mês</option>
                      <option value="profissional">Profissional - R$ 59,99/mês</option>
                      <option value="enterprise">Enterprise - R$ 99,99/mês</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Iniciar Teste Gratuito
                  </button>

                  <p className="text-sm text-gray-600 text-center">
                    Ao criar sua conta, você concorda com nossos{' '}
                    <a href="#" className="text-primary-600 hover:underline">Termos de Uso</a>
                    {' '}e{' '}
                    <a href="#" className="text-primary-600 hover:underline">Política de Privacidade</a>
                  </p>
                </form>
              </div>
            </div>

            {/* Plan Summary */}
            <div>
              <div className="bg-gray-50 rounded-2xl p-8 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Resumo do Plano</h3>
                
                <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{currentPlan.name}</h4>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">{currentPlan.price}</div>
                      <div className="text-sm text-gray-600">{currentPlan.period}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Recursos inclusos:</h5>
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✨ Teste Gratuito de 30 Dias</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Acesso completo a todos os recursos</li>
                    <li>• Sem compromisso ou cartão de crédito</li>
                    <li>• Suporte técnico incluído</li>
                    <li>• Cancele a qualquer momento</li>
                  </ul>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Próximos Passos</h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Preencher formulário de cadastro</li>
                    <li>2. Receber email com link de download</li>
                    <li>3. Instalar o sistema no seu computador</li>
                    <li>4. Ativar com a licença de teste</li>
                    <li>5. Começar a usar imediatamente!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default SignupPage