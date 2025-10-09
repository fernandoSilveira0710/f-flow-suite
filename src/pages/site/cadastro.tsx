import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package2, CreditCard, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PLANS = {
  starter: {
    name: 'Starter',
    price: 97,
    features: ['PDV Básico', 'Estoque', 'Clientes', 'Pets', 'Serviços']
  },
  pro: {
    name: 'Pro',
    price: 197,
    features: ['Tudo do Starter', 'Agenda', 'Profissionais', 'Relatórios', 'Dashboard']
  },
  max: {
    name: 'Max',
    price: 297,
    features: ['Tudo do Pro', 'Multi-lojas', 'API Avançada', 'Suporte Premium']
  }
};

export default function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPlan = location.state?.selectedPlan || 'starter';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    plan: selectedPlan,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    // Validar CPF (formato básico)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(formData.cpf)) {
      toast({
        title: 'Erro',
        description: 'CPF deve estar no formato 000.000.000-00',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simular criação de conta e redirecionamento para pagamento
      console.log('Registration data:', formData);
      
      toast({
        title: 'Conta criada!',
        description: 'Redirecionando para o pagamento...',
      });

      // Redirecionar para página de pagamento com dados do usuário
      setTimeout(() => {
        navigate('/pagamento', { 
          state: { 
            userData: formData,
            plan: PLANS[formData.plan as keyof typeof PLANS]
          } 
        });
      }, 1000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar conta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData({ ...formData, cpf: formatted });
  };

  const currentPlan = PLANS[formData.plan as keyof typeof PLANS];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl grid gap-6 md:grid-cols-2">
        {/* Formulário de Cadastro */}
        <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Package2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Comece sua experiência com a 2F Solutions
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleCPFChange}
                maxLength={14}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="plan">Plano Selecionado</Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLANS).map(([key, plan]) => (
                    <SelectItem key={key} value={key}>
                      {plan.name} - R$ {plan.price}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Criar Conta e Prosseguir para Pagamento
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Faça login
            </Link>
          </div>
          <div className="text-sm text-center">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              ← Voltar para o site
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Resumo do Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plano Selecionado
          </CardTitle>
          <CardDescription>
            Resumo da sua assinatura
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
              <Badge variant="secondary">Mensal</Badge>
            </div>
            <div className="text-2xl font-bold text-primary mb-4">
              R$ {currentPlan.price}/mês
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Recursos inclusos:</h4>
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Próximos passos:</h4>
            <ol className="text-sm space-y-1 text-muted-foreground">
              <li>1. Criar sua conta</li>
              <li>2. Realizar o pagamento</li>
              <li>3. Receber email com licença</li>
              <li>4. Baixar e instalar o sistema</li>
              <li>5. Ativar com sua licença</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}
