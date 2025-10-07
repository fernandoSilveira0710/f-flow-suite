import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, User, Mail, Phone, Tag, Heart, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  fetchCustomers, 
  deleteCustomer, 
  type Customer,
  type CustomerFilters 
} from '@/lib/customers-api';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { toast } from 'sonner';

export default function ClientesIndex() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const { filters, setFilters, activeFiltersCount, clearFilters } = useUrlFilters({
    q: '',
    active: 'all' as 'all' | 'true' | 'false',
    tags: [] as string[],
  });

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerFilters: CustomerFilters = {};
      
      if (filters.q) customerFilters.q = filters.q;
      if (filters.active !== 'all') customerFilters.active = filters.active === 'true';
      if (filters.tags.length > 0) customerFilters.tags = filters.tags;

      const data = await fetchCustomers(customerFilters);
      setCustomers(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    customers.forEach(c => {
      if (c.tags) {
        c.tags.split(',').forEach(tag => tags.add(tag.trim()));
      }
    });
    return Array.from(tags).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Text search (já aplicado na API, mas mantemos para consistência)
    if (filters.q) {
      const searchLower = filters.q.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.toLowerCase().includes(searchLower) ||
          c.documento?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter (já aplicado na API, mas mantemos para consistência)
    if (filters.active === 'true') {
      result = result.filter((c) => c.active);
    } else if (filters.active === 'false') {
      result = result.filter((c) => !c.active);
    }

    // Tags filter (já aplicado na API, mas mantemos para consistência)
    if (filters.tags.length > 0) {
      result = result.filter((c) =>
        filters.tags.some((tag) => c.tags?.includes(tag))
      );
    }

    return result;
  }, [customers, filters]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteCustomer(deleteId);
      await loadCustomers(); // Recarrega a lista
      setDeleteId(null);
      toast.success('Cliente excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ q: value });
  };

  const handleStatusFilter = (value: string) => {
    setFilters({ active: value as 'all' | 'true' | 'false' });
  };

  const handleTagsFilter = (selectedTags: string[]) => {
    setFilters({ tags: selectedTags });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Clientes"
          description="Gerencie seus clientes e seus pets"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie seus clientes e seus pets"
        action={
          <Button onClick={() => navigate('/erp/clientes/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email, telefone ou documento..."
            value={filters.q}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.active} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar Filtros ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Content */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhum cliente encontrado"
          description={
            filters.q || filters.active !== 'all' || filters.tags.length > 0
              ? "Nenhum cliente corresponde aos filtros aplicados."
              : "Comece adicionando seu primeiro cliente."
          }
          action={
            <Button onClick={() => navigate('/erp/clientes/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Pets</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{customer.name}</div>
                      {customer.documento && (
                        <div className="text-sm text-muted-foreground">
                          {customer.documento}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.pets && customer.pets.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="text-sm">
                          {customer.pets.length} pet{customer.pets.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhum pet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.split(',').map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.active ? 'default' : 'secondary'}>
                      {customer.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/erp/clientes/${customer.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/erp/clientes/${customer.id}/pets`)}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Gerenciar Pets
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(customer.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}