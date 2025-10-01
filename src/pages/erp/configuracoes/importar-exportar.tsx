import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { exportData, importData } from '@/lib/settings-api';

export default function ImportarExportarPage() {
  const [importing, setImporting] = useState(false);

  const handleExport = async (type: 'products' | 'customers') => {
    try {
      const csv = await exportData(type);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${Date.now()}.csv`;
      a.click();
      toast.success(`Exportação de ${type === 'products' ? 'produtos' : 'clientes'} concluída`);
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importData(file);
      toast.success(`Importação concluída: ${result.success} sucesso, ${result.errors} erros`);
    } catch (error) {
      toast.error('Erro ao importar dados');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar/Exportar</h1>
        <p className="text-muted-foreground mt-1">Gerencie dados em massa via arquivos CSV</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Dados
            </CardTitle>
            <CardDescription>
              Baixe seus dados em formato CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleExport('products')}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Produtos
            </Button>
            <Button
              onClick={() => handleExport('customers')}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Clientes
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Dados
            </CardTitle>
            <CardDescription>
              Envie um arquivo CSV para importar dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Selecionar arquivo CSV</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv"
                onChange={handleImport}
                disabled={importing}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• O arquivo deve estar em formato CSV</p>
              <p>• A primeira linha deve conter os cabeçalhos</p>
              <p>• Dados inválidos serão ignorados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Formato do Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Produtos (CSV):</p>
              <code className="block bg-muted p-3 rounded text-sm">
                ID,Nome,Categoria,Preço<br />
                1,Produto A,Eletrônicos,99.90<br />
                2,Produto B,Livros,29.90
              </code>
            </div>
            <div>
              <p className="font-medium mb-2">Clientes (CSV):</p>
              <code className="block bg-muted p-3 rounded text-sm">
                ID,Nome,Email,Telefone<br />
                1,João Silva,joao@example.com,(11)99999-9999<br />
                2,Maria Santos,maria@example.com,(11)88888-8888
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
