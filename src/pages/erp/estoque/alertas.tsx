import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStockAlerts } from '@/lib/stock-api';

export default function StockAlertsPage() {
  const alerts = useMemo(() => getStockAlerts(), []);

  const rupturaAlerts = alerts.filter((a) => a.tipo === 'RUPTURA');
  const minimoAlerts = alerts.filter((a) => a.tipo === 'ABAIXO_MINIMO');
  const validadeAlerts = alerts.filter((a) => a.tipo === 'VALIDADE_PROXIMA');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Estoque"
        description="Monitoramento de rupturas, estoque mínimo e validade"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptura</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rupturaAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Produtos sem estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abaixo do Mínimo</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{minimoAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Produtos com estoque baixo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validade Próxima</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validadeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Produtos vencendo em 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts tabs */}
      <Tabs defaultValue="ruptura">
        <TabsList>
          <TabsTrigger value="ruptura">
            Ruptura ({rupturaAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="minimo">
            Abaixo do Mínimo ({minimoAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="validade">
            Validade Próxima ({validadeAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ruptura">
          <Card>
            <CardHeader>
              <CardTitle>Produtos em Ruptura</CardTitle>
              <CardDescription>Produtos sem estoque disponível</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rupturaAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum produto em ruptura
                        </TableCell>
                      </TableRow>
                    ) : (
                      rupturaAlerts.map((alert) => (
                        <TableRow key={alert.produto.id}>
                          <TableCell className="font-medium">{alert.produto.nome}</TableCell>
                          <TableCell>{alert.produto.sku}</TableCell>
                          <TableCell>{alert.produto.categoria || '-'}</TableCell>
                          <TableCell>{alert.produto.estoqueAtual}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{alert.mensagem}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minimo">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Abaixo do Mínimo</CardTitle>
              <CardDescription>Produtos com estoque abaixo do nível mínimo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {minimoAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum produto abaixo do mínimo
                        </TableCell>
                      </TableRow>
                    ) : (
                      minimoAlerts.map((alert) => (
                        <TableRow key={alert.produto.id}>
                          <TableCell className="font-medium">{alert.produto.nome}</TableCell>
                          <TableCell>{alert.produto.sku}</TableCell>
                          <TableCell>{alert.produto.categoria || '-'}</TableCell>
                          <TableCell>{alert.produto.estoqueAtual}</TableCell>
                          <TableCell>{alert.produto.estoqueMinimo}</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-500">{alert.mensagem}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validade">
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Validade Próxima</CardTitle>
              <CardDescription>Produtos que vencem nos próximos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validadeAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum produto com validade próxima
                        </TableCell>
                      </TableRow>
                    ) : (
                      validadeAlerts.map((alert) => (
                        <TableRow key={alert.produto.id}>
                          <TableCell className="font-medium">{alert.produto.nome}</TableCell>
                          <TableCell>{alert.produto.sku}</TableCell>
                          <TableCell>{alert.produto.categoria || '-'}</TableCell>
                          <TableCell>
                            {alert.produto.validade
                              ? new Date(alert.produto.validade).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>{alert.produto.estoqueAtual}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-500">{alert.mensagem}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
