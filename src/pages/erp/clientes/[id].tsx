import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Heart } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  fetchCustomer, 
  updateCustomer, 
  type Customer, 
  type UpdateCustomerDto 
} from '@/lib/customers-api';
import { toast } from 'sonner';

export default function EditarCliente() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<UpdateCustomerDto>({});

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    try {
      setLoadingData(true);
      const data = await fetchCustomer(customerId);
      setCustomer(data);
      setFormData({
        name: data.name,
        documento: data.documento || '',
        email: data.email || '',
        phone: data.phone || '',
        dataNascISO: data.dataNascISO || '',
        tags: data.tags || '',
        notes: data.notes || '',
        address: data.address || '',
        active: data.active,
      });
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      toast.error('Erro ao carregar cliente');
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

    if (!id) return;

    try {
      setLoading(true);
      await updateCustomer(id, formData);
      toast.success('Cliente atualizado com sucesso');
      navigate('/erp/clientes');
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateCustomerDto, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Editar Cliente"
          description="Carregando dados do cliente..."
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
        title={`Editar Cliente: ${customer.name}`}
        description="Atualize as informações do cliente"
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/erp/clientes/${id}/pets`)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Gerenciar Pets
            </Button>
            <Button variant="outline" onClick={() => navigate('/erp/clientes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
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
                  placeholder="Nome completo do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">CPF/CNPJ</Label>
                <Input
                  id="documento"
                  value={formData.documento || ''}
                  onChange={(e) => handleInputChange('documento', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="cliente@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataNascISO">Data de Nascimento</Label>
                <Input
                  id="dataNascISO"
                  type="date"
                  value={formData.dataNascISO || ''}
                  onChange={(e) => handleInputChange('dataNascISO', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags || ''}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="VIP, Frequente, etc. (separadas por vírgula)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Endereço completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações sobre o cliente..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active || false}
                onCheckedChange={(checked) => handleInputChange('active', checked)}
              />
              <Label htmlFor="active">Cliente ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Pets Summary */}
        {customer.pets && customer.pets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Pets do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customer.pets.map((pet) => (
                  <div key={pet.id} className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pet.species} {pet.breed && `• ${pet.breed}`}
                    </div>
                    <Badge variant={pet.active ? 'default' : 'secondary'} className="text-xs">
                      {pet.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => navigate(`/erp/clientes/${id}/pets`)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Gerenciar Pets
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/erp/clientes')}
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