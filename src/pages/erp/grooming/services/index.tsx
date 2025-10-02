import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical } from 'lucide-react';
import { GroomingTabs } from '@/components/erp/grooming-tabs';
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
import { getGroomServices, deleteGroomService, duplicateGroomService } from '@/lib/grooming-api';
import { toast } from 'sonner';

const categoryLabels = {
  BANHO: 'Banho',
  TOSA: 'Tosa',
  HIGIENE: 'Higiene',
  HIDRATACAO: 'Hidratação',
  COMBO: 'Combo',
  OUTROS: 'Outros',
};

export default function GroomingServicesIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [services, setServices] = useState(() => getGroomServices());

  const filteredServices = services.filter((s) =>
    s.nome.toLowerCase().includes(search.toLowerCase()) ||
    s.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleteId) return;
    deleteGroomService(deleteId);
    setServices(getGroomServices());
    setDeleteId(null);
    toast.success('Serviço excluído');
  };

  const handleDuplicate = (id: string) => {
    duplicateGroomService(id);
    setServices(getGroomServices());
    toast.success('Serviço duplicado');
  };

  return (
    <div className="space-y-6">
      <GroomingTabs />
      
      <PageHeader
        title="Serviços de Banho & Tosa"
        description="Gerencie o catálogo de serviços"
        actionLabel="Novo Serviço"
        actionIcon={Plus}
        onAction={() => navigate('/erp/grooming/services/novo')}
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredServices.length === 0 && !search ? (
        <EmptyState
          icon={Plus}
          title="Nenhum serviço cadastrado"
          description="Comece criando seu primeiro serviço de banho & tosa"
          actionLabel="Novo Serviço"
          onAction={() => navigate('/erp/grooming/services/novo')}
        />
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum serviço encontrado"
          description="Tente ajustar sua busca"
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preços por Porte</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {service.cor && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.cor }}
                        />
                      )}
                      <span className="font-medium">{service.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryLabels[service.categoria]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span>PP: R${service.precoPorPorte.PP}</span>
                      <span>P: R${service.precoPorPorte.P}</span>
                      <span>M: R${service.precoPorPorte.M}</span>
                      <span>G: R${service.precoPorPorte.G}</span>
                      <span>GG: R${service.precoPorPorte.GG}</span>
                    </div>
                  </TableCell>
                  <TableCell>{service.duracaoBaseMin} min</TableCell>
                  <TableCell>
                    {service.requerRecurso || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.ativo ? 'default' : 'secondary'}>
                      {service.ativo ? 'Ativo' : 'Inativo'}
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
                          onClick={() => navigate(`/erp/grooming/services/${service.id}/editar`)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(service.id)}>
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(service.id)}
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
              Tem certeza que deseja excluir este serviço?
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
