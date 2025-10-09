import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { createGroomResource, type ResourceType } from '@/lib/grooming-api';
import { getResourceTypes } from '@/pages/erp/grooming/resource-types/index';
import { toast } from 'sonner';

const tipos: ResourceType[] = ['BOX', 'GAIOLA', 'MESA', 'SECADOR'];

export default function NovoRecurso() {
  const navigate = useNavigate();
  const [resourceTypes] = useState(() => getResourceTypes().filter(rt => rt.active));
  const [tipo, setTipo] = useState<ResourceType>(resourceTypes[0]?.name || 'BOX');
  const [nome, setNome] = useState('');
  const [capacidadeSimultanea, setCapacidadeSimultanea] = useState('1');
  const [ativo, setAtivo] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Nome do recurso é obrigatório');
      return;
    }

    createGroomResource({
      tipo,
      nome: nome.trim(),
      capacidadeSimultanea: parseInt(capacidadeSimultanea) || 1,
      ativo,
    });

    toast.success('Recurso criado com sucesso');
    navigate('/erp/grooming/resources');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/grooming/resources')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Recurso</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo recurso físico
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as ResourceType)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {resourceTypes.map((rt) => (
                    <SelectItem key={rt.name} value={rt.name}>{rt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Box 1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidade">Capacidade Simultânea</Label>
            <Input
              id="capacidade"
              type="number"
              min="1"
              value={capacidadeSimultanea}
              onChange={(e) => setCapacidadeSimultanea(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Quantos pets podem usar este recurso ao mesmo tempo
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recurso Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Recursos inativos não aparecem nas alocações
              </p>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/erp/grooming/resources')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar Recurso</Button>
        </div>
      </form>
    </div>
  );
}
