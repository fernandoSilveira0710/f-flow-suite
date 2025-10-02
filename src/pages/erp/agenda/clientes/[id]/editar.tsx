import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getCustomerById, updateCustomer } from '@/lib/schedule-api';
import { toast } from 'sonner';

export default function EditarCliente() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [notas, setNotas] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [isTutor, setIsTutor] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pets, setPets] = useState<
    Array<{ id: string; nome: string; especie?: string; raca?: string; observacoes?: string }>
  >([]);

  useEffect(() => {
    if (!id) return;

    const customer = getCustomerById(id);
    if (!customer) {
      toast.error('Cliente não encontrado');
      navigate('/erp/agenda/clientes');
      return;
    }

    setNome(customer.nome);
    setDocumento(customer.documento || '');
    setEmail(customer.email || '');
    setTelefone(customer.telefone || '');
    setNotas(customer.notas || '');
    setAtivo(customer.ativo);
    setIsTutor(customer.isTutor || false);
    setTags(customer.tags || []);
    setPets(customer.pets || []);
    setLoading(false);
  }, [id, navigate]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddPet = () => {
    setPets([
      ...pets,
      {
        id: `pet-${Date.now()}`,
        nome: '',
        especie: '',
        raca: '',
        observacoes: '',
      },
    ]);
  };

  const handleRemovePet = (petId: string) => {
    setPets(pets.filter((p) => p.id !== petId));
  };

  const handlePetChange = (
    petId: string,
    field: 'nome' | 'especie' | 'raca' | 'observacoes',
    value: string
  ) => {
    setPets(pets.map((p) => (p.id === petId ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !nome.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    updateCustomer(id, {
      nome: nome.trim(),
      documento: documento.trim() || undefined,
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
      notas: notas.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      pets: pets.filter((p) => p.nome.trim()).length > 0 ? pets : undefined,
      ativo,
      isTutor,
    });

    toast.success('Cliente atualizado com sucesso');
    navigate('/erp/agenda/clientes');
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
          onClick={() => navigate('/erp/agenda/clientes')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações do cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Informações Básicas</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">Documento (CPF/CNPJ)</Label>
                <Input
                  id="documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Observações</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas e observações sobre o cliente"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cliente Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Clientes inativos não aparecem na busca rápida
                </p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>É Tutor de Pet?</Label>
                <p className="text-sm text-muted-foreground">
                  Marque se este cliente possui pets para Banho & Tosa
                </p>
              </div>
              <Switch checked={isTutor} onCheckedChange={setIsTutor} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Tags</h3>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Adicionar tag (Ex: VIP, Preferencial)"
              />
              <Button type="button" onClick={handleAddTag}>
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pets (opcional)</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPet}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Pet
              </Button>
            </div>

            {pets.map((pet, index) => (
              <div key={pet.id} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pet {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePet(pet.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome do Pet</Label>
                    <Input
                      value={pet.nome}
                      onChange={(e) => handlePetChange(pet.id, 'nome', e.target.value)}
                      placeholder="Nome do pet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Espécie</Label>
                    <Input
                      value={pet.especie || ''}
                      onChange={(e) => handlePetChange(pet.id, 'especie', e.target.value)}
                      placeholder="Ex: Cachorro, Gato"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Raça</Label>
                  <Input
                    value={pet.raca || ''}
                    onChange={(e) => handlePetChange(pet.id, 'raca', e.target.value)}
                    placeholder="Raça do pet"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={pet.observacoes || ''}
                    onChange={(e) =>
                      handlePetChange(pet.id, 'observacoes', e.target.value)
                    }
                    placeholder="Informações adicionais sobre o pet"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/erp/agenda/clientes')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}
