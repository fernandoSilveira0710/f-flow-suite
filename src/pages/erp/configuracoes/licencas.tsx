import { useEffect, useState } from 'react';
import { Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getLicenseInfo, LicenseInfo } from '@/lib/settings-api';

export default function LicencasPage() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLicenseInfo().then(data => {
      setLicense(data);
      setLoading(false);
    });
  }, []);

  if (loading || !license) return <div>Carregando...</div>;

  const statusColors = {
    ACTIVE: 'default',
    SUSPENDED: 'secondary',
    EXPIRED: 'destructive',
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Licenças & Ativação</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas licenças de uso</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Integração Futura</AlertTitle>
        <AlertDescription>
          Esta tela será conectada ao <strong>2F License Hub</strong> para gerenciamento
          completo de licenças, ativação de dispositivos e controle de acesso.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Licença Principal
          </CardTitle>
          <CardDescription>Informações da sua licença ativa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chave de Licença</p>
              <p className="text-lg font-mono">{license.licenseKey}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={statusColors[license.status || 'ACTIVE']}>
                {license.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiração</p>
              <p className="text-lg">
                {license.expiracao
                  ? new Date(license.expiracao).toLocaleDateString('pt-BR')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dispositivos Ativos</p>
              <p className="text-lg">{license.dispositivosAtivos || 0}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline">Ativar Nova Chave</Button>
            <Button variant="outline">Gerenciar Dispositivos</Button>
            {license.status === 'ACTIVE' && (
              <Button variant="outline">Suspender</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ativações</CardTitle>
          <CardDescription>Últimas ativações e alterações de licença</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { data: '2024-01-15', acao: 'Licença ativada', dispositivo: 'Computador Principal' },
              { data: '2024-01-10', acao: 'Dispositivo adicionado', dispositivo: 'Notebook' },
              { data: '2024-01-01', acao: 'Licença renovada', dispositivo: 'Sistema' },
            ].map((event, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{event.acao}</p>
                  <p className="text-sm text-muted-foreground">{event.dispositivo}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
