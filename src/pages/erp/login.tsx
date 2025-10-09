import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package2, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
}

export default function ErpLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar licença ao carregar a página
  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      const response = await fetch('http://localhost:3010/api/license/status');
      const data = await response.json();
      
      if (!data.valid || data.expired) {
        setShowPlansModal(true);
        await fetchPlans();
      }
    } catch (error) {
      console.error('Erro ao verificar licença:', error);
      // Se não conseguir verificar a licença, mostra os planos
      setShowPlansModal(true);
      await fetchPlans();
    }
  };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      // Tentar buscar planos do Hub primeiro
      const response = await fetch('http://localhost:8081/plans?active=true');
      if (response.ok) {
        const data = await response.json();
        // Mapear os dados do Hub para o formato esperado
        const mappedPlans = data.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price || 0,
          period: plan.billingCycle || 'mês',
          features: plan.features || [],
          popular: plan.popular || false
        }));
        setPlans(mappedPlans);
      } else {
        throw new Error('Hub não disponível');
      }
    } catch (error) {
      console.error('Erro ao buscar planos do Hub:', error);
      // Planos de fallback caso o Hub não esteja disponível
      setPlans([
        {
          id: 'basico',
          name: 'Básico',
          price: 19.99,
          period: 'mês',
          features: [
            'Até 2 usuários',
            'Agendamento básico',
            'PDV simples',
            'Controle de estoque',
            'Relatórios básicos',
            'Suporte por email'
          ]
        },
        {
          id: 'profissional',
          name: 'Profissional',
          price: 59.99,
          period: 'mês',
          popular: true,
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
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99.99,
          period: 'mês',
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
      ]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simular autenticação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        });
        navigate('/erp/dashboard');
      } else {
        toast({
          title: "Erro no login",
          description: "Por favor, preencha todos os campos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      toast({
        title: "Plano selecionado",
        description: "Redirecionando para pagamento...",
      });
      
      // Aqui seria implementada a integração com o sistema de pagamento
      // Por enquanto, apenas fecha o modal e permite o login
      setShowPlansModal(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar a seleção do plano.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Package2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">F-Flow Suite</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="link" className="text-sm text-muted-foreground">
              Esqueceu sua senha?
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Planos */}
      <Dialog open={showPlansModal} onOpenChange={setShowPlansModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Licença Expirada ou Inválida
            </DialogTitle>
            <DialogDescription>
              Para continuar usando o F-Flow Suite, selecione um plano abaixo:
            </DialogDescription>
          </DialogHeader>
          
          {loadingPlans ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      Mais Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      R$ {plan.price.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      Selecionar Plano
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}