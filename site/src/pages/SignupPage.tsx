import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Check, Package2, ArrowLeft, Eye, EyeOff } from 'lucide-react'

const SignupPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedPlan = searchParams.get('plan') || 'basico'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
    plan: selectedPlan
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const plans = {
    basico: {
      name: 'Básico',
      price: 'R$ 19,99',
      period: '/mês',
      planKey: 'starter',
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
      planKey: 'pro',
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
      planKey: 'max',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // 1. Registrar usuário/tenant no Hub
      const registerResponse = await fetch(`${import.meta.env.VITE_HUB_API_URL}/public/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          planId: currentPlan.planKey
        }),
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.message || 'Erro ao criar conta')
      }

      const registerData = await registerResponse.json()
      console.log('Usuário registrado:', registerData)

      // 2. Criar licença de teste gratuito
      const licenseResponse = await fetch(`${import.meta.env.VITE_HUB_API_URL}/licenses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          cpf: '000.000.000-00', // CPF fictício para teste gratuito
          planKey: currentPlan.planKey,
          paymentId: 'FREE_TRIAL_' + Date.now() // ID fictício para teste gratuito
        }),
      })

      if (!licenseResponse.ok) {
        console.warn('Erro ao criar licença, mas usuário foi criado')
      } else {
        const licenseData = await licenseResponse.json()
        console.log('Licença criada:', licenseData)
      }

      // Sucesso - mostrar mensagem e redirecionar
      alert(`🎉 Conta criada com sucesso!

📧 Email: ${formData.email}
🏢 Empresa: ${formData.company}
📦 Plano: ${currentPlan.name}

✅ Teste gratuito de 30 dias ativado
📥 Em breve você receberá um email com as instruções para download

Você será redirecionado para a página de instalação.`)
      
      navigate('/docs/instalacao')
      
    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      setError(error.message || 'Erro interno do servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
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
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Senha *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Mínimo 6 caracteres"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use esta senha para acessar o sistema após a instalação
                    </p>
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
                      disabled={isLoading}
                    >
                      <option value="basico">Básico - R$ 19,99/mês</option>
                      <option value="profissional">Profissional - R$ 59,99/mês</option>
                      <option value="enterprise">Enterprise - R$ 99,99/mês</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Criando conta...' : 'Iniciar Teste Gratuito'}
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