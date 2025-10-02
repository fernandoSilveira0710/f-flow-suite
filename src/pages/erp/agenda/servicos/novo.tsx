import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createService } from '@/lib/schedule-api';
import { ArrowLeft } from 'lucide-react';

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#F59E0B', label: 'Âmbar' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#14B8A6', label: 'Teal' },
];

export default function NovoServico() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [duracaoMin, setDuracaoMin] = useState('30');
  const [precoBase, setPrecoBase] = useState('');
  const [bufferAntesMin, setBufferAntesMin] = useState('');
  const [bufferDepoisMin, setBufferDepoisMin] = useState('');
  const [cor, setCor] = useState('#3B82F6');
  const [ativo, setAtivo] = useState(true);
  const [exigeRecursoUnico, setExigeRecursoUnico] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do serviço é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!duracaoMin || parseInt(duracaoMin) <= 0) {
      toast({
        title: 'Erro',
        description: 'Duração deve ser maior que zero',
        variant: 'destructive',
      });
      return;
    }

    if (!precoBase || parseFloat(precoBase) < 0) {
      toast({
        title: 'Erro',
        description: 'Preço deve ser maior ou igual a zero',
        variant: 'destructive',
      });
      return;
    }

    const service = createService({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      categoria: categoria.trim() || undefined,
      duracaoMin: parseInt(duracaoMin),
      precoBase: parseFloat(precoBase),
      bufferAntesMin: bufferAntesMin ? parseInt(bufferAntesMin) : undefined,
      bufferDepoisMin: bufferDepoisMin ? parseInt(bufferDepoisMin) : undefined,
      exigeRecursoUnico,
      cor,
      ativo,
    });

    toast({
      title: 'Serviço criado',
      description: `${service.nome} foi cadastrado com sucesso`,
    });

    navigate('/erp/agenda/servicos');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Novo Serviço" description="Cadastre um novo serviço na agenda" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais do serviço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome">
                  Nome do Serviço <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Banho & Tosa Completo"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Descrição detalhada do serviço..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  placeholder="Ex: Higiene, Tosa"
                />
              </div>

              <div>
                <Label htmlFor="cor">Cor no Calendário</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCor(option.value)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        cor === option.value ? 'border-primary scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: option.value }}
                      title={option.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duração e Preço */}
        <Card>
          <CardHeader>
            <CardTitle>Duração e Preço</CardTitle>
            <CardDescription>Configure o tempo e valor do serviço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duracaoMin">
                  Duração (minutos) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duracaoMin"
                  type="number"
                  min="1"
                  value={duracaoMin}
                  onChange={e => setDuracaoMin(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="precoBase">
                  Preço Base (R$) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="precoBase"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precoBase}
                  onChange={e => setPrecoBase(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buffers */}
        <Card>
          <CardHeader>
            <CardTitle>Buffers de Tempo</CardTitle>
            <CardDescription>
              Tempo adicional antes e depois do serviço (preparação e limpeza)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bufferAntesMin">Buffer Antes (minutos)</Label>
                <Input
                  id="bufferAntesMin"
                  type="number"
                  min="0"
                  value={bufferAntesMin}
                  onChange={e => setBufferAntesMin(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo de preparação antes do serviço
                </p>
              </div>

              <div>
                <Label htmlFor="bufferDepoisMin">Buffer Depois (minutos)</Label>
                <Input
                  id="bufferDepoisMin"
                  type="number"
                  min="0"
                  value={bufferDepoisMin}
                  onChange={e => setBufferDepoisMin(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Tempo de limpeza após o serviço</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exige Recurso Único</Label>
                <p className="text-sm text-muted-foreground">
                  Requer sala/box/cadeira exclusiva durante o serviço
                </p>
              </div>
              <Switch checked={exigeRecursoUnico} onCheckedChange={setExigeRecursoUnico} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Serviço Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Serviços inativos não aparecem no agendamento
                </p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Serviço</Button>
        </div>
      </form>
    </div>
  );
}
