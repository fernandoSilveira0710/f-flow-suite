import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Heart, User } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  fetchCustomer, 
  type Customer 
} from '@/lib/customers-api';
import { 
  fetchPetsByTutor, 
  deletePet, 
  type Pet 
} from '@/lib/pets-api';
import { toast } from 'sonner';

export default function GerenciarPetsCliente() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (customerId: string) => {
    try {
      setLoading(true);
      const [customerData, petsData] = await Promise.all([
        fetchCustomer(customerId),
        fetchPetsByTutor(customerId)
      ]);
      setCustomer(customerData);
      setPets(petsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    try {
      await deletePet(petId);
      setPets(prev => prev.filter(pet => pet.id !== petId));
      toast.success(`Pet ${petName} removido com sucesso`);
    } catch (error) {
      console.error('Erro ao remover pet:', error);
      toast.error('Erro ao remover pet');
    }
  };

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gerenciar Pets"
          description="Carregando dados..."
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Cliente não encontrado"
          description="O cliente solicitado não foi encontrado"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Pets de ${customer.name}`}
        description="Gerencie os pets do cliente"
        action={
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/erp/clientes/${id}/pets/novo`)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pet
            </Button>
            <Button variant="outline" onClick={() => navigate(`/erp/clientes/${id}`)}>
              <User className="h-4 w-4 mr-2" />
              Ver Cliente
            </Button>
            <Button variant="outline" onClick={() => navigate('/erp/clientes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        }
      />

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Tutor
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar pets por nome, espécie ou raça..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPets.map((pet) => (
          <Card key={pet.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <CardTitle className="text-lg">{pet.name}</CardTitle>
                </div>
                <Badge variant={pet.active ? 'default' : 'secondary'}>
                  {pet.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Espécie: </span>
                  <span className="font-medium">{pet.species}</span>
                </div>
                {pet.breed && (
                  <div>
                    <span className="text-sm text-muted-foreground">Raça: </span>
                    <span className="font-medium">{pet.breed}</span>
                  </div>
                )}
                {pet.birthDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Nascimento: </span>
                    <span className="font-medium">
                      {new Date(pet.birthDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {pet.weight && (
                  <div>
                    <span className="text-sm text-muted-foreground">Peso: </span>
                    <span className="font-medium">{pet.weight} kg</span>
                  </div>
                )}
                {pet.color && (
                  <div>
                    <span className="text-sm text-muted-foreground">Cor: </span>
                    <span className="font-medium">{pet.color}</span>
                  </div>
                )}
              </div>

              {pet.notes && (
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Observações:</div>
                  <div className="text-sm">{pet.notes}</div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/erp/clientes/${id}/pets/${pet.id}`)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Pet</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o pet "{pet.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeletePet(pet.id, pet.name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Nenhum pet encontrado' : 'Nenhum pet cadastrado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando o primeiro pet deste cliente'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate(`/erp/clientes/${id}/pets/novo`)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pet
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}