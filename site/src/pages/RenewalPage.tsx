import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Check, Package2, ArrowLeft, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  price: string
  period: string
  features: string[]
  popular?: boolean
}

interface User {
  id: string
  email: string
  name: string
  tenantId: string
}

const RenewalPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'login' | 'plans' | 'confirmation'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [hubOnline, setHubOnline] = useState(false)
  
  // Dados do formulário de login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Verificar se Hub está online
  useEffect(() => {
    const checkHubStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_HUB_API_URL}/health`)
        setHubOnline(response.ok)
      } catch (error) {
        setHubOnline(false)
      }
    }
    
    checkHubStatus()
  }, [])

  // Carregar planos do Hub
  const loadPlans = async () => {
    if (!hubOnline) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_HUB_API_URL}/plans`)
      if (response.ok) {
        const hubPlans = await response.json()
        setPlans(hubPlans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          price: `R$ ${plan.price.toFixed(2)}`,
          period: '/mês',
          features: plan.features || [],
          popular: plan.popular || false
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    }
  }

  // Login do usuário
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hubOnline) {
      toast.error('Sistema offline. Não é possível renovar licenças no momento.')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_HUB_API_URL}/public/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const result = await response.json()
        setUser({
          id: result.user.id,
          email: result.user.email,
          name: result.user.displayName || result.user.email.split('@')[0],
          tenantId: result.user.tenant.id
        })
        
        await loadPlans()
        setStep('plans')
        
        toast.success('Login realizado com sucesso!')
      } else {
        toast.error('Credenciais inválidas. Verifique email e senha.')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Selecionar plano
  const handleSelectPlan = async (planId: string) => {
    if (!user) return
    
    setIsLoading(true)
    
    try {
      // Atualizar plano no Hub
      const response = await fetch(`${import.meta.env.VITE_HUB_API_URL}/licenses/${user.tenantId}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planKey: planId
        }),
      })

      if (response.ok) {
        setSelectedPlan(planId)
        setStep('confirmation')
        toast.success('Plano atualizado com sucesso!')
      } else {
        toast.error('Erro ao atualizar plano. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao selecionar plano:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Renovação de Licença
            </h1>
            <p className="text-lg text-gray-600">
              {step === 'login' && 'Entre com suas credenciais para renovar sua licença'}
              {step === 'plans' && 'Selecione um plano para renovar sua licença'}
              {step === 'confirmation' && 'Licença renovada com sucesso!'}
            </p>
          </div>

          {/* Status do Hub */}
          {!hubOnline && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-900">Sistema Offline</h3>
                  <p className="text-red-800">
                    Não é possível renovar licenças no momento. Tente novamente mais tarde.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 1: Login */}
          {step === 'login' && (
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-center mb-6">
                  <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
                    <Package2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="seu@email.com"
                      required
                      disabled={!hubOnline}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                      disabled={!hubOnline}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !hubOnline}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Entrando...
                      </div>
                    ) : (
                      'Entrar'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Etapa 2: Seleção de Planos */}
          {step === 'plans' && (
            <div>
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Bem-vindo, {user?.name}!</h3>
                    <p className="text-blue-800">
                      Selecione um plano para renovar sua licença.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-lg shadow-md p-8 relative ${
                      plan.popular ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Mais Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-primary-600 mb-1">{plan.price}</div>
                      <div className="text-gray-600">{plan.period}</div>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
                        plan.popular
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processando...
                        </div>
                      ) : (
                        'Selecionar Plano'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etapa 3: Confirmação */}
          {step === 'confirmation' && selectedPlanData && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Licença Renovada com Sucesso!
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Seu plano <strong>{selectedPlanData.name}</strong> foi ativado com sucesso.
                  Você já pode voltar ao sistema e continuar usando todas as funcionalidades.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Próximos Passos:</h3>
                  <ol className="text-left text-gray-700 space-y-2">
                    <li>1. Volte ao sistema principal</li>
                    <li>2. Faça login normalmente</li>
                    <li>3. Sua nova licença será sincronizada automaticamente</li>
                  </ol>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.close()}
                    className="bg-primary-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Fechar e Voltar ao Sistema
                  </button>
                  <button
                    onClick={() => {
                      setStep('login')
                      setUser(null)
                      setSelectedPlan('')
                      setEmail('')
                      setPassword('')
                    }}
                    className="bg-gray-100 text-gray-900 py-3 px-6 rounded-md font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Renovar Outra Licença
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default RenewalPage