import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical } from 'lucide-react';
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
import { getGroomResources, deleteGroomResource } from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function GroomingResourcesIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resources, setResources] = useState(() => getGroomResources());

  const filteredResources = resources.filter((r) =>
    r.nome.toLowerCase().includes(search.toLowerCase()) ||
    r.tipo.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleteId) return;
    deleteGroomResource(deleteId);
    setResources(getGroomResources());
    setDeleteId(null);
    toast.success('Recurso excluído');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recursos Físicos"
        description="Gerencie box, gaiolas, mesas e secadores"
        actionLabel="Novo Recurso"
        actionIcon={Plus}
        onAction={() => navigate('/erp/grooming/resources/novo')}
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar recursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredResources.length === 0 && !search ? (
        <EmptyState
          icon={Plus}
          title="Nenhum recurso cadastrado"
          description="Comece criando seu primeiro recurso físico"
          actionLabel="Novo Recurso"
          onAction={() => navigate('/erp/grooming/resources/novo')}
        />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum recurso encontrado"
          description="Tente ajustar sua busca"
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Capacidade Simultânea</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <span className="font-medium">{resource.nome}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{resource.tipo}</Badge>
                  </TableCell>
                  <TableCell>{resource.capacidadeSimultanea}</TableCell>
                  <TableCell>
                    <Badge variant={resource.ativo ? 'default' : 'secondary'}>
                      {resource.ativo ? 'Ativo' : 'Inativo'}
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
                          onClick={() => navigate(`/erp/grooming/resources/${resource.id}/editar`)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(resource.id)}
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
              Tem certeza que deseja excluir este recurso?
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
