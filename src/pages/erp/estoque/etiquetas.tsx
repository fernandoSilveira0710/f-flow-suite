import { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getProducts, type Product } from '@/lib/stock-api';
import { useToast } from '@/hooks/use-toast';
import { useEntitlements } from '@/hooks/use-entitlements';
import { UpgradeDialog } from '@/components/erp/upgrade-dialog';

export default function StockLabelsPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [includeName, setIncludeName] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeSKU, setIncludeSKU] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const products = getProducts();
  const { toast } = useToast();
  const { entitlements } = useEntitlements();

  const handlePrint = () => {
    if (!entitlements.reports) {
      setShowUpgrade(true);
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos um produto',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Gerando etiquetas...',
      description: 'Visualização de impressão será aberta (mock)',
    });

    // Mock print
    window.print();
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const selectedProductsData = products.filter((p) => selectedProducts.includes(p.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etiquetas de Produtos"
        description="Geração e impressão de etiquetas"
      />

      {!entitlements.reports && (
        <Card className="border-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500">Requer Pro/Max</Badge>
              <CardTitle>Recurso Bloqueado</CardTitle>
            </div>
            <CardDescription>
              A impressão de etiquetas está disponível apenas nos planos Pro e Max.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowUpgrade(true)}>Fazer Upgrade</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>Defina as opções das etiquetas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tamanho da Etiqueta</Label>
              <Select value={labelSize} onValueChange={(v: any) => setLabelSize(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequena (40x20mm)</SelectItem>
                  <SelectItem value="medium">Média (50x30mm)</SelectItem>
                  <SelectItem value="large">Grande (60x40mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Incluir Nome</Label>
                <Switch checked={includeName} onCheckedChange={setIncludeName} />
              </div>

              <div className="flex items-center justify-between">
                <Label>Incluir Preço</Label>
                <Switch checked={includePrice} onCheckedChange={setIncludePrice} />
              </div>

              <div className="flex items-center justify-between">
                <Label>Incluir SKU</Label>
                <Switch checked={includeSKU} onCheckedChange={setIncludeSKU} />
              </div>

              <div className="flex items-center justify-between">
                <Label>Incluir Código de Barras</Label>
                <Switch checked={includeBarcode} onCheckedChange={setIncludeBarcode} />
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product selection */}
        <Card>
          <CardHeader>
            <CardTitle>Seleção de Produtos</CardTitle>
            <CardDescription>
              Selecione os produtos ({selectedProducts.length} selecionados)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProducts.includes(product.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{product.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                        {product.precoVenda && ` • R$ ${product.precoVenda.toFixed(2)}`}
                      </p>
                    </div>
                    <div className="h-5 w-5 rounded border-2 flex items-center justify-center">
                      {selectedProducts.includes(product.id) && (
                        <div className="h-3 w-3 rounded-sm bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {selectedProductsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visualização</CardTitle>
            <CardDescription>Prévia das etiquetas selecionadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedProductsData.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded p-2 flex flex-col items-center justify-center text-center ${
                    labelSize === 'small'
                      ? 'h-20'
                      : labelSize === 'medium'
                      ? 'h-24'
                      : 'h-32'
                  }`}
                >
                  {includeName && (
                    <p className="text-xs font-medium truncate w-full">{product.nome}</p>
                  )}
                  {includePrice && product.precoVenda && (
                    <p className="text-sm font-bold">R$ {product.precoVenda.toFixed(2)}</p>
                  )}
                  {includeSKU && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                  {includeBarcode && product.barcode && (
                    <p className="text-xs font-mono">{product.barcode}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature="Impressão de Etiquetas"
        requiredPlan="Pro ou Max"
      />
    </div>
  );
}
