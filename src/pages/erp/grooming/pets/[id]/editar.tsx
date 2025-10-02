import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getPetById, updatePet, getTutors, type Especie, type Porte, type TipoPelo, type Temperamento } from '@/lib/grooming-api';
import { toast } from 'sonner';

const especies: Especie[] = ['CACHORRO', 'GATO'];
const portes: Porte[] = ['PP', 'P', 'M', 'G', 'GG'];
const tiposPelo: TipoPelo[] = ['CURTO', 'MEDIO', 'LONGO', 'DUAS_CAMADAS', 'POODLE'];
const temperamentos: Temperamento[] = ['DOCIL', 'REATIVO', 'AGRESSIVO', 'ANSIOSO', 'DESCONHECIDO'];

export default function EditarPet() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const tutors = getTutors().filter(t => t.ativo);

  const [tutorId, setTutorId] = useState('');
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<Especie>('CACHORRO');
  const [raca, setRaca] = useState('');
  const [porte, setPorte] = useState<Porte>('M');
  const [tipoPelo, setTipoPelo] = useState<TipoPelo>('CURTO');
  const [idadeMeses, setIdadeMeses] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [temperamento, setTemperamento] = useState<Temperamento>('DOCIL');
  const [alergias, setAlergias] = useState('');
  const [restricoes, setRestricoes] = useState('');
  const [ultimaVacinaAntirrabica, setUltimaVacinaAntirrabica] = useState('');
  const [antipulgasEm, setAntipulgasEm] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!id) return;

    const pet = getPetById(id);
    if (!pet) {
      toast.error('Pet não encontrado');
      navigate('/erp/grooming/pets');
      return;
    }

    setTutorId(pet.tutorId);
    setNome(pet.nome);
    setEspecie(pet.especie);
    setRaca(pet.raca || '');
    setPorte(pet.porte);
    setTipoPelo(pet.tipoPelo);
    setIdadeMeses(pet.idadeMeses ? String(pet.idadeMeses) : '');
    setPesoKg(pet.pesoKg ? String(pet.pesoKg) : '');
    setTemperamento(pet.temperamento);
    setAlergias(pet.alergias || '');
    setRestricoes(pet.restricoes || '');
    setUltimaVacinaAntirrabica(pet.ultimaVacinaAntirrabica || '');
    setAntipulgasEm(pet.antipulgasEm || '');
    setObservacoes(pet.observacoes || '');
    setAtivo(pet.ativo);
    setLoading(false);
  }, [id, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !tutorId || !nome.trim()) {
      toast.error('Tutor e nome do pet são obrigatórios');
      return;
    }

    updatePet(id, {
      tutorId,
      nome: nome.trim(),
      especie,
      raca: raca.trim() || undefined,
      porte,
      tipoPelo,
      idadeMeses: idadeMeses ? parseInt(idadeMeses) : undefined,
      pesoKg: pesoKg ? parseFloat(pesoKg) : undefined,
      temperamento,
      alergias: alergias.trim() || undefined,
      restricoes: restricoes.trim() || undefined,
      ultimaVacinaAntirrabica: ultimaVacinaAntirrabica || undefined,
      antipulgasEm: antipulgasEm || undefined,
      observacoes: observacoes.trim() || undefined,
      ativo,
    });

    toast.success('Pet atualizado');
    navigate('/erp/grooming/pets');
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/grooming/pets')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Pet</h1>
          <p className="text-muted-foreground mt-1">Atualize as informações do pet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Tutor e Identificação</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tutor">
                  Tutor <span className="text-destructive">*</span>
                </Label>
                <Select value={tutorId} onValueChange={setTutorId}>
                  <SelectTrigger id="tutor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {tutors.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome} {t.telefone && `- ${t.telefone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome do Pet <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="especie">Espécie</Label>
                <Select value={especie} onValueChange={(v) => setEspecie(v as Especie)}>
                  <SelectTrigger id="especie">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {especies.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="raca">Raça</Label>
                <Input
                  id="raca"
                  value={raca}
                  onChange={(e) => setRaca(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porte">Porte</Label>
                <Select value={porte} onValueChange={(v) => setPorte(v as Porte)}>
                  <SelectTrigger id="porte">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="PP">PP - Mini</SelectItem>
                    <SelectItem value="P">P - Pequeno</SelectItem>
                    <SelectItem value="M">M - Médio</SelectItem>
                    <SelectItem value="G">G - Grande</SelectItem>
                    <SelectItem value="GG">GG - Gigante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Características Físicas</h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tipoPelo">Tipo de Pelo</Label>
                <Select value={tipoPelo} onValueChange={(v) => setTipoPelo(v as TipoPelo)}>
                  <SelectTrigger id="tipoPelo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {tiposPelo.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idade">Idade (meses)</Label>
                <Input
                  id="idade"
                  type="number"
                  value={idadeMeses}
                  onChange={(e) => setIdadeMeses(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperamento">Temperamento</Label>
              <Select value={temperamento} onValueChange={(v) => setTemperamento(v as Temperamento)}>
                <SelectTrigger id="temperamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {temperamentos.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Saúde e Cuidados</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vacina">Última Vacina Antirrábica</Label>
                <Input
                  id="vacina"
                  type="date"
                  value={ultimaVacinaAntirrabica}
                  onChange={(e) => setUltimaVacinaAntirrabica(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="antipulgas">Antipulgas Aplicado Em</Label>
                <Input
                  id="antipulgas"
                  type="date"
                  value={antipulgasEm}
                  onChange={(e) => setAntipulgasEm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alergias">Alergias</Label>
              <Textarea
                id="alergias"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restricoes">Restrições</Label>
              <Textarea
                id="restricoes"
                value={restricoes}
                onChange={(e) => setRestricoes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações Gerais</Label>
              <Textarea
                id="obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pet Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Pets inativos não aparecem na busca
              </p>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/erp/grooming/pets')}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}
