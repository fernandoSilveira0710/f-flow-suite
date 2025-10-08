import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getGroomServiceById, updateGroomService, type ServiceCategory } from '@/lib/grooming-api';
import { toast } from 'sonner';

const categories: { value: ServiceCategory; label: string }[] = [
  { value: 'BANHO', label: 'Banho' },
  { value: 'TOSA', label: 'Tosa' },
  { value: 'HIGIENE', label: 'Higiene' },
  { value: 'HIDRATACAO', label: 'Hidratação' },
  { value: 'COMBO', label: 'Combo' },
  { value: 'OUTROS', label: 'Outros' },
];

const recursos = [
  { value: 'NENHUM', label: 'Nenhum' },
  { value: 'BOX', label: 'Box' },
  { value: 'MESA', label: 'Mesa' },
  { value: 'SECADOR', label: 'Secador' },
];

export default function EditarGroomingService() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<ServiceCategory>('BANHO');
  const [precoPP, setPrecoPP] = useState('');
  const [precoP, setPrecoP] = useState('');
  const [precoM, setPrecoM] = useState('');
  const [precoG, setPrecoG] = useState('');
  const [precoGG, setPrecoGG] = useState('');
  const [duracaoBaseMin, setDuracaoBaseMin] = useState('');
  const [requerRecurso, setRequerRecurso] = useState('NENHUM');
  const [cor, setCor] = useState('#3B82F6');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!id) return;

    const service = getGroomServiceById(id);
    if (!service) {
      toast.error('Serviço não encontrado');
      navigate('/erp/grooming/services');
      return;
    }

    setNome(service.nome);
    setCategoria(service.categoria);
    setPrecoPP(String(service.precoPorPorte.PP));
    setPrecoP(String(service.precoPorPorte.P));
    setPrecoM(String(service.precoPorPorte.M));
    setPrecoG(String(service.precoPorPorte.G));
    setPrecoGG(String(service.precoPorPorte.GG));
    setDuracaoBaseMin(String(service.duracaoBaseMin));
    setRequerRecurso(service.requerRecurso || 'NENHUM');
    setCor(service.cor || '#3B82F6');
    setAtivo(service.ativo);
    setLoading(false);
  }, [id, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !nome.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }

    updateGroomService(id, {
      nome: nome.trim(),
      categoria,
      precoPorPorte: {
        PP: parseFloat(precoPP) || 0,
        P: parseFloat(precoP) || 0,
        M: parseFloat(precoM) || 0,
        G: parseFloat(precoG) || 0,
        GG: parseFloat(precoGG) || 0,
      },
      duracaoBaseMin: parseInt(duracaoBaseMin) || 60,
      requerRecurso: requerRecurso !== 'NENHUM' ? (requerRecurso as any) : null,
      cor,
      ativo,
    });

    toast.success('Serviço atualizado');
    navigate('/erp/grooming/services');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/erp/grooming/services')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Serviço</h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações do serviço
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Serviço <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as ServiceCategory)}>
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Preços por Porte</h3>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="precoPP">PP (Mini)</Label>
                <Input
                  id="precoPP"
                  type="number"
                  step="0.01"
                  value={precoPP}
                  onChange={(e) => setPrecoPP(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoP">P (Pequeno)</Label>
                <Input
                  id="precoP"
                  type="number"
                  step="0.01"
                  value={precoP}
                  onChange={(e) => setPrecoP(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoM">M (Médio)</Label>
                <Input
                  id="precoM"
                  type="number"
                  step="0.01"
                  value={precoM}
                  onChange={(e) => setPrecoM(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoG">G (Grande)</Label>
                <Input
                  id="precoG"
                  type="number"
                  step="0.01"
                  value={precoG}
                  onChange={(e) => setPrecoG(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoGG">GG (Gigante)</Label>
                <Input
                  id="precoGG"
                  type="number"
                  step="0.01"
                  value={precoGG}
                  onChange={(e) => setPrecoGG(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração Base (min)</Label>
              <Input
                id="duracao"
                type="number"
                value={duracaoBaseMin}
                onChange={(e) => setDuracaoBaseMin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurso">Recurso Requerido</Label>
              <Select value={requerRecurso} onValueChange={setRequerRecurso}>
                <SelectTrigger id="recurso">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {recursos.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor">Cor (calendário)</Label>
              <Input
                id="cor"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Serviço Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Serviços inativos não aparecem na listagem
              </p>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/erp/grooming/services')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}
