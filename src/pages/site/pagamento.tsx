import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Package2, CreditCard, Check, Shield, Clock, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { API_URLS } from '@/lib/env';

export default function Pagamento() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { userData, plan } = location.state || {};
  
  const [paymentData, setPaymentData] = useState({
    method: 'credit_card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    installments: '1',
  });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!userData || !plan) {
      toast({
        title: 'Erro',
        description: 'Dados do usuário não encontrados. Redirecionando...',
        variant: 'destructive',
      });
      navigate('/cadastro');
    }
  }, [userData, plan, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Chamar o HUB para criar a licença após pagamento aprovado
      const response = await fetch(`${API_URLS.HUB}/licenses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'system', // Tenant do sistema para criação de licenças
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          planKey: plan.id,
          paymentId: `pay_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar licença');
      }

      const licenseData = await response.json();
      
      console.log('Payment processed:', {
        userData,
        plan,
        paymentData,
        licenseData
      });

      toast({
        title: 'Pagamento aprovado!',
        description: 'Sua licença foi gerada e enviada por email.',
      });

      // Redirecionar para página de sucesso
      navigate('/pagamento/sucesso', {
        state: {
          userData,
          plan,
          licenseKey: licenseData.data.licenseKey,
          tenantId: licenseData.data.tenantId,
          downloadUrl: licenseData.data.downloadUrl,
          expiresAt: licenseData.data.expiresAt,
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{2})/, '$1/$2');
  };

  if (!userData || !plan) {
    return null;
  }

  const installmentOptions = [1, 2, 3, 6, 12];
  const installmentValue = plan.price / parseInt(paymentData.installments);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl grid gap-6 md:grid-cols-2">
        {/* Formulário de Pagamento */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Finalizar Pagamento</CardTitle>
            <CardDescription>
              Complete sua assinatura do F-Flow Suite
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Método de Pagamento */}
              <div>
                <Label className="text-base font-medium">Método de Pagamento</Label>
                <RadioGroup 
                  value={paymentData.method} 
                  onValueChange={(value) => setPaymentData({ ...paymentData, method: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Crédito
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentData.method === 'credit_card' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({ 
                        ...paymentData, 
                        cardNumber: formatCardNumber(e.target.value) 
                      })}
                      maxLength={19}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardName">Nome no Cartão</Label>
                    <Input
                      id="cardName"
                      placeholder="Nome como está no cartão"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry">Validade</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/AA"
                        value={paymentData.cardExpiry}
                        onChange={(e) => setPaymentData({ 
                          ...paymentData, 
                          cardExpiry: formatExpiry(e.target.value) 
                        })}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input
                        id="cardCvv"
                        placeholder="000"
                        value={paymentData.cardCvv}
                        onChange={(e) => setPaymentData({ 
                          ...paymentData, 
                          cardCvv: e.target.value.replace(/\D/g, '') 
                        })}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="installments">Parcelas</Label>
                    <Select 
                      value={paymentData.installments} 
                      onValueChange={(value) => setPaymentData({ ...paymentData, installments: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {installmentOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}x de R$ {(plan.price / num).toFixed(2)}
                            {num === 1 ? ' (à vista)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? 'Processando...' : `Pagar R$ ${plan.price.toFixed(2)}`}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Pagamento seguro e criptografado
            </div>
            <div className="text-sm text-center">
              <Link to="/cadastro" className="text-muted-foreground hover:text-primary">
                ← Voltar ao cadastro
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Resumo do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
            <CardDescription>
              Confirme os detalhes da sua assinatura
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Dados do Cliente */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Dados do Cliente</h4>
              <div className="text-sm space-y-1">
                <p><strong>Nome:</strong> {userData.name}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>CPF:</strong> {userData.cpf}</p>
              </div>
            </div>

            {/* Plano Selecionado */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <Badge variant="secondary">Mensal</Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-sm text-muted-foreground">Recursos inclusos:</h4>
                {plan.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plano {plan.name}</span>
                  <span>R$ {plan.price.toFixed(2)}</span>
                </div>
                {parseInt(paymentData.installments) > 1 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{paymentData.installments}x no cartão</span>
                    <span>R$ {installmentValue.toFixed(2)}/mês</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {plan.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Após o pagamento
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Você receberá um email com sua licença
                </li>
                <li className="flex items-center gap-2">
                  <Package2 className="h-3 w-3" />
                  Link para download do F-Flow Suite
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Instruções de instalação e ativação
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}