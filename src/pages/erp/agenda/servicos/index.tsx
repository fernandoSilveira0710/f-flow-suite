import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Eye, Pencil, Trash2, Copy, X } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { getServices, deleteService, duplicateService, type Service } from '@/lib/schedule-api';
import { cn } from '@/lib/utils';

export default function ServicosIndex() {
  const [services, setServices] = useState<Service[]>(getServices());
  const [search, setSearch] = useState('');
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const { toast } = useToast();

  const filteredServices = useMemo(() => {
    let result = services;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        s =>
          s.nome.toLowerCase().includes(lower) ||
          s.categoria?.toLowerCase().includes(lower) ||
          s.descricao?.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [services, search]);

  const handleDelete = (service: Service) => {
    if (deleteService(service.id)) {
      setServices(getServices());
      toast({
        title: 'Serviço excluído',
        description: `${service.nome} foi removido com sucesso`,
      });
    }
    setServiceToDelete(null);
  };

  const handleDuplicate = (service: Service) => {
    const duplicated = duplicateService(service.id);
    if (duplicated) {
      setServices(getServices());
      toast({
        title: 'Serviço duplicado',
        description: `${duplicated.nome} foi criado`,
      });
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (services.length === 0) {
    return (
      <>
        <PageHeader
          title="Serviços"
          description="Gerencie seu catálogo de serviços"
        />
        <EmptyState
          icon={Plus}
          title="Nenhum serviço cadastrado"
          description="Comece criando seu primeiro serviço"
          actionLabel="Novo Serviço"
          onAction={() => {}}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Serviços" description={`${services.length} serviços cadastrados`} />

      {/* Search and actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button asChild>
          <Link to="/erp/agenda/servicos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Link>
        </Button>
      </div>

      {/* Services table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Buffers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum serviço encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map(service => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {service.cor && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: service.cor }}
                        />
                      )}
                      <div>
                        <p className="font-medium">{service.nome}</p>
                        {service.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {service.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.categoria ? (
                      <Badge variant="outline">{service.categoria}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{service.duracaoMin} min</TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {formatCurrency(service.precoBase)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {service.bufferAntesMin || service.bufferDepoisMin ? (
                      <span>
                        {service.bufferAntesMin ? `${service.bufferAntesMin}m antes` : ''}
                        {service.bufferAntesMin && service.bufferDepoisMin ? ' / ' : ''}
                        {service.bufferDepoisMin ? `${service.bufferDepoisMin}m depois` : ''}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.ativo ? 'default' : 'secondary'}>
                      {service.ativo ? 'Ativo' : 'Inativo'}
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
                        <DropdownMenuItem asChild>
                          <Link to={`/erp/agenda/servicos/${service.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(service)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setServiceToDelete(service)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{serviceToDelete?.nome}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => serviceToDelete && handleDelete(serviceToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
