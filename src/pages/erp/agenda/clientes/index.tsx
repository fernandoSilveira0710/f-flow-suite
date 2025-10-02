import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, User, Mail, Phone, Tag } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { AgendaTabs } from '@/components/erp/agenda-tabs';
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
import { getCustomers, deleteCustomer, type Customer } from '@/lib/schedule-api';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { toast } from 'sonner';

export default function ClientesIndex() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());

  const { filters, setFilters, activeFiltersCount, clearFilters } = useUrlFilters({
    q: '',
    status: 'all' as 'all' | 'active' | 'inactive',
    tags: [] as string[],
  });

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    customers.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Text search
    if (filters.q) {
      const searchLower = filters.q.toLowerCase();
      result = result.filter(
        (c) =>
          c.nome.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.telefone?.toLowerCase().includes(searchLower) ||
          c.documento?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status === 'active') {
      result = result.filter((c) => c.ativo);
    } else if (filters.status === 'inactive') {
      result = result.filter((c) => !c.ativo);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter((c) =>
        filters.tags.some((tag) => c.tags?.includes(tag))
      );
    }

    return result;
  }, [customers, filters]);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCustomer(deleteId);
    setCustomers(getCustomers());
    setDeleteId(null);
    toast.success('Cliente excluído com sucesso');
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    setFilters({ tags: newTags });
  };

  return (
    <div className="space-y-6">
      <AgendaTabs />
      
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes cadastrados`}
        actionLabel="Novo Cliente"
        actionIcon={Plus}
        onAction={() => navigate('/erp/agenda/clientes/novo')}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, email ou documento..."
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value: any) => setFilters({ status: value })}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">Tags:</span>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhum cliente cadastrado"
          description="Comece cadastrando seu primeiro cliente"
          actionLabel="Novo Cliente"
          onAction={() => navigate('/erp/agenda/clientes/novo')}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum cliente encontrado"
          description="Tente ajustar os filtros de busca"
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Pets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.nome}</span>
                      {customer.documento && (
                        <span className="text-xs text-muted-foreground">
                          {customer.documento}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.telefone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.telefone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.pets && customer.pets.length > 0 ? (
                      <div className="flex flex-col gap-0.5 text-sm">
                        {customer.pets.map((pet) => (
                          <span key={pet.id} className="text-muted-foreground">
                            {pet.nome}
                            {pet.especie && ` (${pet.especie})`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.ativo ? 'default' : 'secondary'}>
                      {customer.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background z-50">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/erp/agenda/clientes/${customer.id}/editar`)
                          }
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/erp/agenda/novo?customerId=${customer.id}`)
                          }
                        >
                          Novo Agendamento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(customer.id)}
                        >
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
