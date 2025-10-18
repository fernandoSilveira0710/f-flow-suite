import { useEffect, useState } from 'react';
import { Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { API_URLS, ENDPOINTS } from '@/lib/env';

type LicenseUI = {
  tenantId: string | null;
  deviceId: string | null;
  planKey: string | null;
  status: string | null;
  expiresAt: string | null;
  graceDays?: number | null;
  lastChecked?: string | null;
  updatedAt?: string | null;
};

export default function LicencasPage() {
  const [license, setLicense] = useState<LicenseUI | null>(null);
  const [install, setInstall] = useState<{ tenantId?: string; deviceId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [currentRes, statusRes, installRes] = await Promise.all([
          fetch(`${API_URLS.CLIENT_LOCAL}/licensing/current`, { headers: { 'Accept': 'application/json' } }),
          fetch(`${API_URLS.CLIENT_LOCAL}/licensing/status`, { headers: { 'Accept': 'application/json' } }),
          fetch(`${API_URLS.CLIENT_LOCAL}/licensing/install-status`, { headers: { 'Accept': 'application/json' } }),
        ]);

        const currentJson = await currentRes.json();
        const statusJson = await statusRes.json();
        const installJson = await installRes.json();

        const planKeyRaw: string | null = currentJson?.license?.plan || statusJson?.planKey || null;
        const planKey = planKeyRaw === 'enterprise' ? 'max' : planKeyRaw;

        setLicense({
          tenantId: currentJson?.license?.tenantId || statusJson?.tenantId || installJson?.tenantId || null,
          deviceId: currentJson?.license?.deviceId || installJson?.deviceId || null,
          planKey: planKey,
          status: (statusJson?.status || currentJson?.status || null),
          expiresAt: currentJson?.license?.expiresAt || statusJson?.expiresAt || null,
          graceDays: currentJson?.license?.graceDays ?? null,
          lastChecked: statusJson?.lastChecked || null,
          updatedAt: statusJson?.updatedAt || null,
        });
        setInstall({ tenantId: installJson?.tenantId, deviceId: installJson?.deviceId });
      } catch (e) {
        console.error('Erro ao buscar dados de licença:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !license) return <div>Carregando...</div>;

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    active: 'default',
    activated: 'default',
    development: 'secondary',
    offline_grace: 'secondary',
    expired: 'destructive',
  };

  const offlineDaysLeft = (() => {
    const ts = license.updatedAt || license.lastChecked;
    if (!ts) return null;
    const last = new Date(ts).getTime();
    const days = Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
    const LIMIT = 5;
    return Math.max(0, LIMIT - days);
  })();

  const handleActivate = async () => {
    if (!license?.tenantId) return;
    setActivating(true);
    try {
      const res = await fetch(ENDPOINTS.CLIENT_LICENSING_ACTIVATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          tenantId: license.tenantId,
          deviceId: license.deviceId || 'web-client',
          licenseKey: licenseKey || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Falha na ativação: ${res.status}`);
      }
      // Atualizar dados após ativação
      setDialogOpen(false);
      setLicenseKey('');
      // Recarregar dados
      setLoading(true);
      const [currentRes, statusRes] = await Promise.all([
        fetch(`${API_URLS.CLIENT_LOCAL}/licensing/current`, { headers: { 'Accept': 'application/json' } }),
        fetch(`${API_URLS.CLIENT_LOCAL}/licensing/status`, { headers: { 'Accept': 'application/json' } }),
      ]);
      const currentJson = await currentRes.json();
      const statusJson = await statusRes.json();
      const planKeyRaw: string | null = currentJson?.license?.plan || statusJson?.planKey || null;
      const planKey = planKeyRaw === 'enterprise' ? 'max' : planKeyRaw;
      setLicense({
        tenantId: currentJson?.license?.tenantId || statusJson?.tenantId || null,
        deviceId: currentJson?.license?.deviceId || null,
        planKey: planKey,
        status: (statusJson?.status || currentJson?.status || null),
        expiresAt: currentJson?.license?.expiresAt || statusJson?.expiresAt || null,
        graceDays: currentJson?.license?.graceDays ?? null,
        lastChecked: statusJson?.lastChecked || null,
        updatedAt: statusJson?.updatedAt || null,
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao ativar licença. Veja o console para detalhes.');
    } finally {
      setActivating(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Licenças & Ativação</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas licenças de uso</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Licença Atual
          </CardTitle>
          <CardDescription>Dados integrados do Client-Local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tenant ID</p>
              <p className="text-lg font-mono">{license.tenantId || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dispositivo</p>
              <p className="text-lg font-mono">{license.deviceId || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano</p>
              <p className="text-lg">{license.planKey || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {license.status ? (
                <Badge variant={statusColors[license.status] || 'secondary'}>
                  {license.status}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiração</p>
              <p className="text-lg">
                {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
            {offlineDaysLeft != null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dias offline restantes</p>
                <p className="text-lg">{offlineDaysLeft}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Ativar Nova Chave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ativar Licença</DialogTitle>
                  <DialogDescription>Integração direta com Client-Local/HUB</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tenant">Tenant ID</Label>
                    <Input id="tenant" value={license.tenantId || ''} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="device">Device ID</Label>
                    <Input id="device" value={license.deviceId || 'web-client'} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="key">Chave de Licença (opcional)</Label>
                    <Input id="key" placeholder="XXXX-XXXX-XXXX-XXXX" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleActivate} disabled={activating || !license?.tenantId}>
                    {activating ? 'Ativando...' : 'Ativar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Gerenciar Dispositivos</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Instalação</DialogTitle>
                  <DialogDescription>Status do dispositivo atual</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <p className="text-sm">Tenant: <span className="font-mono">{install?.tenantId || '—'}</span></p>
                  <p className="text-sm">Device: <span className="font-mono">{install?.deviceId || '—'}</span></p>
                </div>
                <DialogFooter>
                  <Button variant="outline">Fechar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status do Licenciamento</CardTitle>
          <CardDescription>Dados de verificação e cache</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última verificação</p>
              <p className="text-lg">{license.lastChecked ? new Date(license.lastChecked).toLocaleString('pt-BR') : '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cache atualizado em</p>
              <p className="text-lg">{license.updatedAt ? new Date(license.updatedAt).toLocaleString('pt-BR') : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
