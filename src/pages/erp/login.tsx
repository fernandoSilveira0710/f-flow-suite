import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Package2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { PlansModal } from '@/components/erp/plans-modal';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [licenseWarning, setLicenseWarning] = useState<string | null>(null);
  const { login, user, licenseStatus } = useAuth();
  const navigate = useNavigate();

  // Verificar se deve mostrar modal de planos ao carregar
  useEffect(() => {
    const shouldShowPlansModal = localStorage.getItem('show_plans_modal');
    if (shouldShowPlansModal === 'true' && user) {
      setShowPlansModal(true);
    }
  }, [user]);

  // Verificar avisos de licença
  useEffect(() => {
    const licenseExpiredOffline = localStorage.getItem('license_expired_offline');
    const userNotFound = localStorage.getItem('user_not_found');
    
    if (licenseExpiredOffline === 'true') {
      setLicenseWarning('Sua licença expirou e o sistema está offline. Conecte-se à internet para renovar.');
      localStorage.removeItem('license_expired_offline');
    } else if (userNotFound === 'true') {
      setLicenseWarning('Usuário não encontrado no sistema. Cadastre-se no site institucional.');
      localStorage.removeItem('user_not_found');
    } else if (user && licenseStatus && !licenseStatus.isValid) {
      setLicenseWarning('Sua licença está vencida ou inválida. Renove para continuar usando o sistema.');
    }
  }, [user, licenseStatus]);

  // Redirecionar se já estiver logado e não precisar do modal
  useEffect(() => {
    if (user && !localStorage.getItem('show_plans_modal') && licenseStatus?.isValid) {
      navigate('/erp/dashboard');
    }
  }, [user, navigate, licenseStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 INICIANDO PROCESSO DE LOGIN NO COMPONENTE');
    console.log('📧 Email:', email);
    console.log('🔑 Senha fornecida:', password ? 'SIM' : 'NÃO');
    
    if (!email || !password) {
      console.log('❌ Email ou senha não fornecidos');
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('⏳ Estado de loading ativado');

    try {
      console.log('🔐 Chamando função login do AuthContext...');
      const success = await login(email, password);
      console.log('🔐 Resultado do login:', success ? 'SUCESSO' : 'FALHA');

      if (success) {
        console.log('✅ Login bem-sucedido - verificando se deve mostrar modal de planos...');
        
        // Verificar se deve mostrar modal de planos
        const showPlansModal = localStorage.getItem('show_plans_modal');
        console.log('📋 Flag show_plans_modal:', showPlansModal);
        
        if (showPlansModal === 'true') {
          console.log('📋 Mostrando modal de planos...');
          localStorage.removeItem('show_plans_modal');
          setShowPlansModal(true);
        } else {
          console.log('🎯 Navegando para dashboard...');
          navigate('/erp/dashboard');
        }
      } else {
        console.log('❌ Login falhou - permanecendo na tela de login');
        // O erro já foi tratado no AuthContext
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NO COMPONENTE DE LOGIN:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Finalizando processo no componente - desativando loading');
      setIsLoading(false);
    }
  };

  const handlePlanSelected = (planKey: string) => {
    console.log('Plano selecionado:', planKey);
    setShowPlansModal(false);
    navigate('/erp/dashboard');
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
          
          {/* Aviso de Licença */}
          {licenseWarning && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 mb-2">
                    {licenseWarning}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                    onClick={() => window.open('http://localhost:5173/renovacao', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Renovar Licença
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center space-y-2">
            <Button variant="link" className="text-sm text-muted-foreground">
              Esqueceu sua senha?
            </Button>
            <div className="text-sm text-muted-foreground">
              Não tem uma licença? {' '}
              <Button 
                variant="link" 
                className="text-sm text-primary p-0 h-auto font-normal"
                onClick={() => window.open('/site', '_blank')}
              >
                Visite nosso site institucional
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Planos */}
      <PlansModal 
        open={showPlansModal} 
        onClose={() => setShowPlansModal(false)}
        onPlanSelected={handlePlanSelected}
      />
    </div>
  );
}