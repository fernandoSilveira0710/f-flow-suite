import { PageHeader } from '@/components/erp/page-header';
import { SettingsSection } from '@/components/settings/settings-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportExportSettings() {
  const handleExportProducts = () => {
    toast.info('Exportação de produtos em desenvolvimento');
  };

  const handleExportCustomers = () => {
    toast.info('Exportação de clientes em desenvolvimento');
  };

  const handleImport = () => {
    toast.info('Importação em desenvolvimento');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Importar/Exportar" description="Gerencie dados em CSV" />

      <SettingsSection title="Exportar dados" description="Baixe seus dados em formato CSV">
        <div className="flex gap-3">
          <Button onClick={handleExportProducts}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Produtos
          </Button>
          <Button onClick={handleExportCustomers}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Clientes
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Importar dados" description="Envie um CSV para importar dados">
        <div>
          <Button onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Selecionar arquivo CSV
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Formatos aceitos: produtos.csv, clientes.csv
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
