import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload, FileSpreadsheet, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { exportData } from '@/lib/settings-api';
import { createProduct } from '@/lib/products-api';
import { adjustStock } from '@/lib/stock-api';

type EntityType = 'products' | 'customers';

export default function ImportarExportarPage() {
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | undefined>();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowsPreview, setRowsPreview] = useState<any[][]>([]);
  const [rowsAll, setRowsAll] = useState<any[][]>([]);
  const [entity, setEntity] = useState<EntityType>('products');
  const [mapping, setMapping] = useState<Record<string, string | undefined>>({});

  // Resultado de importação
  const [resultOpen, setResultOpen] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    success: number;
    errors: { row: number; column?: string; message: string }[];
  } | null>(null);

  // Progresso em tempo real
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressState, setProgressState] = useState<{
    total: number;
    current: number; // 1-based
    success: number;
    errors: number;
    logs: { row: number; status: 'success' | 'error'; message?: string }[];
  }>({ total: 0, current: 0, success: 0, errors: 0, logs: [] });

  const handleExport = async (type: EntityType) => {
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

  const parseCsvHeader = (text: string): { headers: string[]; rows: any[][] } => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const splitLine = (line: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          // toggle when next char is not another quote
          if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          out.push(cur.trim()); cur = '';
        } else {
          cur += ch;
        }
      }
      out.push(cur.trim());
      return out;
    };
    const headers = splitLine(lines[0]);
    const rows = lines.slice(1).map(splitLine);
    return { headers, rows };
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImporting(true);
    try {
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.csv')) {
        const text = await file.text();
        const { headers, rows } = parseCsvHeader(text);
        setHeaders(headers);
        setRowsPreview(rows.slice(0, 5));
        setRowsAll(rows);
        toast.success(`CSV carregado (${headers.length} colunas)`);
      } else if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
        try {
          const XLSX = await import('xlsx');
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const sheet = wb.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          const hdrs = (rows[0] || []).map((h: any) => String(h || '').trim());
          setHeaders(hdrs);
          const dataRows = (rows || []).slice(1);
          setRowsPreview(dataRows.slice(0, 5));
          setRowsAll(dataRows);
          toast.success(`Planilha carregada (${hdrs.length} colunas)`);
        } catch (err) {
          console.error(err);
          toast.error('Falha ao ler planilha Excel.');
        }
      } else {
        toast.error('Formato não suportado. Use CSV ou Excel (.xlsx).');
      }
    } finally {
      setImporting(false);
    }
  };

  const targetFields: { key: string; label: string }[] = useMemo(() => {
    if (entity === 'products') {
      return [
        { key: 'name', label: 'Nome' },
        { key: 'description', label: 'Descrição' },
        { key: 'sku', label: 'SKU' },
        { key: 'barcode', label: 'Código de Barras' },
        { key: 'price', label: 'Preço' },
        { key: 'cost', label: 'Custo' },
        { key: 'category', label: 'Categoria' },
        { key: 'unit', label: 'Unidade' },
        { key: 'minStock', label: 'Estoque Mínimo' },
        { key: 'maxStock', label: 'Estoque Máximo (opcional)' },
        { key: 'trackStock', label: 'Controla Estoque' },
        { key: 'stock', label: 'Estoque Inicial' },
        { key: 'marginPct', label: 'Margem (%)' },
        { key: 'expiryDate', label: 'Validade (ISO)' },
        { key: 'active', label: 'Ativo' },
      ];
    }
    return [
      { key: 'name', label: 'Nome' },
      { key: 'documento', label: 'Documento' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telefone' },
      { key: 'dataNascISO', label: 'Data de Nascimento (ISO)' },
      { key: 'tags', label: 'Tags' },
      { key: 'notes', label: 'Observações' },
      { key: 'address', label: 'Endereço' },
      { key: 'active', label: 'Ativo' },
    ];
  }, [entity]);

  const onDropAssign = (fieldKey: string, ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const header = ev.dataTransfer.getData('text/plain');
    if (!header) return;
    setMapping(prev => ({ ...prev, [fieldKey]: header }));
  };
  const onDragStartHeader = (header: string, ev: React.DragEvent<HTMLDivElement>) => {
    ev.dataTransfer.setData('text/plain', header);
  };
  const clearMapping = (fieldKey: string) => setMapping(prev => ({ ...prev, [fieldKey]: undefined }));
  const resetAll = () => { setMapping({}); setHeaders([]); setRowsPreview([]); setFileName(undefined); };

  // Helpers de conversão
  const parseNumber = (v: any): number | undefined => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).replace(',', '.').trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
  };
  const parseInteger = (v: any): number | undefined => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    if (s === '') return undefined;
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? undefined : n;
  };
  const parseBoolean = (v: any): boolean | undefined => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim().toLowerCase();
    if (['true', '1', 'sim', 'ativo', 'yes'].includes(s)) return true;
    if (['false', '0', 'nao', 'não', 'inativo', 'no'].includes(s)) return false;
    return undefined;
  };

  const getColumnIndex = (headerName?: string): number | undefined => {
    if (!headerName) return undefined;
    const idx = headers.findIndex(h => h === headerName);
    return idx >= 0 ? idx : undefined;
  };

  const importWithMapping = async () => {
    if (entity !== 'products') {
      toast.error('Neste momento, a importação com mapeamento está focada em Produtos.');
      return;
    }
    if (!headers.length || !rowsAll.length) {
      toast.error('Carregue um arquivo válido antes de importar.');
      return;
    }

    setImporting(true);
    setProgressOpen(true);
    setProgressState({ total: rowsAll.length, current: 0, success: 0, errors: 0, logs: [] });
    const errors: { row: number; column?: string; message: string }[] = [];
    let success = 0;

    // Prepara índices das colunas mapeadas
    const colIdx: Record<string, number | undefined> = {};
    Object.keys(mapping).forEach(key => { colIdx[key] = getColumnIndex(mapping[key]); });

    // Validação de obrigatórios
    if (colIdx['name'] === undefined) {
      toast.error('Campo obrigatório "Nome" não mapeado.');
      setImporting(false);
      return;
    }
    if (colIdx['price'] === undefined) {
      toast.error('Campo obrigatório "Preço" não mapeado.');
      setImporting(false);
      return;
    }

    for (let i = 0; i < rowsAll.length; i++) {
      const row = rowsAll[i];
      const excelRowNumber = i + 2; // +1 cabeçalho, +1 index base 0
      try {
        const getVal = (key: string) => colIdx[key] !== undefined ? row[colIdx[key] as number] : undefined;
        const name = String(getVal('name') ?? '').trim();
        if (!name) {
          errors.push({ row: excelRowNumber, column: mapping['name'], message: 'Nome obrigatório vazio' });
          continue;
        }

        const price = parseNumber(getVal('price'));
        if (price === undefined) {
          errors.push({ row: excelRowNumber, column: mapping['price'], message: 'Preço inválido ou vazio' });
          continue;
        }

        const payload = {
          name,
          description: String(getVal('description') ?? '').trim() || undefined,
          sku: String(getVal('sku') ?? '').trim() || undefined,
          barcode: String(getVal('barcode') ?? '').trim() || undefined,
          price,
          cost: parseNumber(getVal('cost')),
          category: String(getVal('category') ?? '').trim() || undefined,
          unit: String(getVal('unit') ?? '').trim() || undefined,
          minStock: parseInteger(getVal('minStock')),
          maxStock: parseInteger(getVal('maxStock')),
          trackStock: parseBoolean(getVal('trackStock')) ?? true,
          active: parseBoolean(getVal('active')) ?? true,
          marginPct: parseNumber(getVal('marginPct')),
          expiryDate: (() => {
            const v = getVal('expiryDate');
            const s = v !== undefined && v !== null ? String(v).trim() : '';
            return s ? s : undefined;
          })(),
        } as Parameters<typeof createProduct>[0];

        // Cria o produto
        const created = await createProduct(payload);

        // Ajuste de estoque inicial
        const initialStock = parseInteger(getVal('stock')) || 0;
        if ((payload.trackStock ?? true) && initialStock > 0) {
          try {
            await adjustStock({ productId: created.id, delta: initialStock, reason: 'INITIAL_IMPORT' });
          } catch (e: any) {
            errors.push({ row: excelRowNumber, column: mapping['stock'], message: `Falha ao ajustar estoque: ${e?.message || 'erro desconhecido'}` });
          }
        }

        success++;
        // Atualiza progresso
        setProgressState(prev => {
          const next = {
            ...prev,
            current: i + 1,
            success: prev.success + 1,
            logs: [...prev.logs, { row: excelRowNumber, status: 'success' as const }].slice(-80),
          };
          return next;
        });
      } catch (e: any) {
        const msg = e?.message || 'Falha ao criar produto';
        errors.push({ row: excelRowNumber, message: msg });
        setProgressState(prev => {
          const next = {
            ...prev,
            current: i + 1,
            errors: prev.errors + 1,
            logs: [...prev.logs, { row: excelRowNumber, status: 'error' as const, message: msg }].slice(-80),
          };
          return next;
        });
      }
      // Garente que o React tenha chance de pintar o progresso
      await new Promise(r => setTimeout(r, 0));
    }

    setResultSummary({ success, errors });
    setResultOpen(true);
    setProgressOpen(false);
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar/Exportar</h1>
        <p className="text-muted-foreground mt-1">Envie CSV/Excel, mapeie colunas e importe com segurança</p>
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
            <Button onClick={() => handleExport('products')} variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Exportar Produtos
            </Button>
            <Button onClick={() => handleExport('customers')} variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Exportar Clientes
            </Button>
          </CardContent>
        </Card>

        {/* Import Section com mapeamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Dados
            </CardTitle>
            <CardDescription>
              Envie um arquivo CSV ou Excel, detecte colunas e mapeie para nossos campos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Selecionar arquivo</Label>
              <Input id="import-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} disabled={importing} />
            </div>
            <div className="flex items-center gap-3">
              <Label className="min-w-[120px]">Tipo de dados</Label>
              <Select value={entity} onValueChange={(v) => setEntity(v as EntityType)}>
                <option value="products">Produtos</option>
                <option value="customers">Clientes</option>
              </Select>
            </div>
            {headers.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <List className="h-4 w-4" />
                    <span className="font-medium">Colunas detectadas {fileName ? `(${fileName})` : ''}</span>
                  </div>
                  <div className="rounded-md border p-2 space-y-2 min-h-[180px] max-h-[420px] overflow-y-auto">
                    {headers.map(h => (
                      <div
                        key={h}
                        draggable
                        onDragStart={(ev) => onDragStartHeader(h, ev)}
                        className="px-3 py-2 bg-muted rounded cursor-move text-sm"
                        title="Arraste para um campo alvo"
                      >
                        {h || '(vazio)'}
                      </div>
                    ))}
                  </div>
                  {rowsPreview.length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Prévia: {rowsPreview.length} de {rowsAll.length} linhas
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="font-medium">Campos do sistema ({entity === 'products' ? 'Produtos' : 'Clientes'})</span>
                  </div>
                  <div className="rounded-md border p-2 space-y-2">
                    {targetFields.map(f => (
                      <div key={f.key} className="flex items-center justify-between gap-2">
                        <div className="text-sm w-1/3">{f.label}</div>
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => onDropAssign(f.key, e)}
                          className="flex-1 px-3 py-2 border rounded bg-background text-sm min-h-[36px]"
                        >
                          {mapping[f.key] ? (
                            <div className="flex items-center justify-between">
                              <span className="truncate">{mapping[f.key]}</span>
                              <Button size="sm" variant="ghost" onClick={() => clearMapping(f.key)}>Limpar</Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Solte uma coluna aqui</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" onClick={resetAll}>Limpar tudo</Button>
                    <Button
                      disabled={headers.length === 0 || importing}
                      onClick={importWithMapping}
                    >
                      Importar com mapeamento
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• CSV: primeira linha deve conter os cabeçalhos</p>
              <p>• Excel: primeira linha da primeira aba será usada como cabeçalho</p>
              <p>• Arraste cada coluna detectada para o campo correspondente</p>
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

      {/* Progresso em tempo real */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Importando dados...</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              Linha {Math.min(progressState.current + 1, progressState.total)} de {progressState.total}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600">Sucessos: {progressState.success}</span>
              <span className="text-red-600">Erros: {progressState.errors}</span>
            </div>
            <div className="rounded-md border p-3 max-h-[300px] overflow-y-auto">
              <div className="text-xs space-y-1">
                {progressState.logs.map((l, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span>Linha {l.row}</span>
                    <span className={l.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                      {l.status === 'success' ? 'Sucesso' : `Erro: ${l.message || ''}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resultado da Importação */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resultado da Importação</DialogTitle>
          </DialogHeader>
          {resultSummary && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm">Sucesso:</span>
                <span className="font-semibold text-green-600">{resultSummary.success}</span>
                <span className="text-sm">Erros:</span>
                <span className="font-semibold text-red-600">{resultSummary.errors.length}</span>
              </div>
              {resultSummary.errors.length > 0 && (
                <div className="rounded-md border p-3 max-h-[300px] overflow-y-auto">
                  <div className="text-sm font-medium mb-2">Detalhes dos erros</div>
                  <div className="text-xs space-y-1">
                    {resultSummary.errors.map((e, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span>Linha {e.row}</span>
                        <span>Coluna: {e.column || '-'}</span>
                        <span>Motivo: {e.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setResultOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
