import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Download, Mail, Copy, ExternalLink, ArrowRight, Shield, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function PagamentoSucesso() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { userData, plan, licenseKey, downloadUrl } = location.state || {};
  
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!userData || !plan || !licenseKey) {
      navigate('/cadastro');
      return;
    }

    // Simular envio do email
    const sendEmail = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setEmailSent(true);
    };

    sendEmail();
  }, [userData, plan, licenseKey, navigate]);

  const copyLicenseKey = () => {
    navigator.clipboard.writeText(licenseKey);
    toast({
      title: 'Licença copiada!',
      description: 'A chave da licença foi copiada para a área de transferência.',
    });
  };

  const handleDownload = () => {
    // Simular download
    window.open(downloadUrl, '_blank');
    toast({
      title: 'Download iniciado',
      description: 'O download do F-Flow Suite foi iniciado.',
    });
  };

  if (!userData || !plan || !licenseKey) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">Pagamento Aprovado!</CardTitle>
            <CardDescription>
              Sua assinatura do F-Flow Suite foi ativada com sucesso
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status do Email */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className={`h-5 w-5 ${emailSent ? 'text-green-600' : 'text-yellow-600'}`} />
                <div>
                  <p className="font-medium">
                    {emailSent ? 'Email enviado com sucesso!' : 'Enviando email...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {emailSent 
                      ? `Verifique sua caixa de entrada em ${userData.email}`
                      : 'Aguarde enquanto enviamos suas informações de acesso'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Informações da Licença */}
            <div className="space-y-4">
              <h3 className="font-semibold">Sua Licença</h3>
              
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Chave da Licença:</span>
                  <Button variant="outline" size="sm" onClick={copyLicenseKey}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <code className="text-sm bg-background p-2 rounded border block">
                  {licenseKey}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Plano:</span>
                  <p className="font-medium">{plan.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{userData.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{userData.cpf}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default" className="bg-green-600">Ativa</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Download */}
            <div className="space-y-4">
              <h3 className="font-semibold">Download do Sistema</h3>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">F-Flow Suite</p>
                    <p className="text-sm text-muted-foreground">Versão mais recente para Windows</p>
                  </div>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Próximos Passos */}
            <div className="space-y-4">
              <h3 className="font-semibold">Próximos Passos</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Baixe e instale o F-Flow Suite</p>
                    <p className="text-sm text-muted-foreground">
                      Execute o instalador baixado e siga as instruções
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Ative sua licença</p>
                    <p className="text-sm text-muted-foreground">
                      Na primeira execução, insira sua chave de licença para ativar o sistema
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Comece a usar</p>
                    <p className="text-sm text-muted-foreground">
                      Acesse o sistema com suas credenciais e explore todos os recursos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Importantes */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Informações Importantes
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Guarde sua chave de licença em local seguro</li>
                <li>• O sistema funciona offline após a ativação inicial</li>
                <li>• Validação online necessária a cada 30 dias</li>
                <li>• Suporte técnico disponível em nosso portal</li>
              </ul>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link to="/suporte">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Central de Suporte
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">
                  Voltar ao Site
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}