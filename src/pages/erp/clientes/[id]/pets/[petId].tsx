import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Heart, User } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  fetchCustomer, 
  type Customer 
} from '@/lib/customers-api';
import { 
  fetchPet,
  updatePet, 
  fetchPetSpecies,
  type Pet,
  type UpdatePetDto 
} from '@/lib/pets-api';
import { toast } from 'sonner';

export default function EditarPet() {
  const navigate = useNavigate();
  const { id, petId } = useParams<{ id: string; petId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [species, setSpecies] = useState<string[]>([]);
  const [formData, setFormData] = useState<UpdatePetDto>({});

  useEffect(() => {
    if (id && petId) {
      loadData(id, petId);
    }
  }, [id, petId]);

  const loadData = async (customerId: string, petId: string) => {
    try {
      setLoadingData(true);
      const [customerData, petData, speciesData] = await Promise.all([
        fetchCustomer(customerId),
        fetchPet(petId),
        fetchPetSpecies()
      ]);
      setCustomer(customerData);
      setPet(petData);
      setSpecies(speciesData);
      setFormData({
        name: petData.name,
        species: petData.species,
        breed: petData.breed || '',
        birthDate: petData.birthDate || '',
        weight: petData.weight || 0,
        observations: petData.observations || '',
        active: petData.active,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      navigate('/erp/clientes');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.species?.trim()) {
      toast.error('Espécie é obrigatória');
      return;
    }

    if (!petId) return;

    try {
      setLoading(true);
      await updatePet(petId, formData);
      toast.success('Pet atualizado com sucesso');
      navigate(`/erp/clientes/${id}/pets`);
    } catch (error) {
      console.error('Erro ao atualizar pet:', error);
      toast.error('Erro ao atualizar pet');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdatePetDto, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Editar Pet"
          description="Carregando dados..."
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!customer || !pet) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pet não encontrado"
          description="O pet solicitado não foi encontrado"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar Pet: ${pet.name}`}
        description={`Pet de ${customer.name}`}
      />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate(`/erp/clientes/${id}`)}>
          <User className="h-4 w-4 mr-2" />
          Ver Cliente
        </Button>
        <Button variant="outline" onClick={() => navigate(`/erp/clientes/${id}/pets`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Tutor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Nome</div>
              <div className="font-medium">{customer.name}</div>
            </div>
            {customer.phone && (
              <div>
                <div className="text-sm text-muted-foreground">Telefone</div>
                <div className="font-medium">{customer.phone}</div>
              </div>
            )}
            {customer.email && (
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{customer.email}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Informações do Pet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nome do pet"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="species">Espécie *</Label>
                <Select
                  value={formData.species || ''}
                  onValueChange={(value) => handleInputChange('species', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    {species.map((specie) => (
                      <SelectItem key={specie} value={specie}>
                        {specie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Raça</Label>
                <Input
                  id="breed"
                  value={formData.breed || ''}
                  onChange={(e) => handleInputChange('breed', e.target.value)}
                  placeholder="Raça do pet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations || ''}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Observações sobre o pet (temperamento, cuidados especiais, etc.)"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active || false}
                onCheckedChange={(checked) => handleInputChange('active', checked)}
              />
              <Label htmlFor="active">Pet ativo</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/erp/clientes/${id}/pets`)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}