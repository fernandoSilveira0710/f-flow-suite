import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { GroomingTabs } from '@/components/erp/grooming-tabs';
import { getProfessionals, deleteProfessional } from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function GroomingProfissionaisIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [professionals, setProfessionals] = useState(() => getProfessionals());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProfessionals = professionals.filter((prof) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      prof.name.toLowerCase().includes(lower) ||
      prof.email?.toLowerCase().includes(lower) ||
      prof.phone?.toLowerCase().includes(lower) ||
      prof.role?.toLowerCase().includes(lower)
    );
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deleteProfessional(deleteId);
    setProfessionals(getProfessionals());
    setDeleteId(null);
    toast.success('Profissional excluído');
  };

  return (
    <div className="space-y-6">
      <GroomingTabs />

      <PageHeader
        title="Profissionais de Banho & Tosa"
        description="Gerencie os profissionais que atendem pets"
        actionLabel="Novo Profissional"
        onAction={() => navigate('/erp/grooming/profissionais/novo')}
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, função, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredProfessionals.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={search ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
          description={
            search
              ? 'Tente ajustar os termos da busca'
              : 'Cadastre profissionais para atenderem os pets'
          }
          actionLabel={!search ? 'Cadastrar Profissional' : undefined}
          onAction={!search ? () => navigate('/erp/grooming/profissionais/novo') : undefined}
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Funções</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessionals.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {prof.phone && <div>{prof.phone}</div>}
                      {prof.email && (
                        <div className="text-muted-foreground">{prof.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {prof.role && (
                        <Badge variant="secondary" className="text-xs">
                          {prof.role}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={prof.active ? 'default' : 'secondary'}>
                      {prof.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/erp/grooming/profissionais/${prof.id}/editar`)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(prof.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
              Tem certeza que deseja excluir este profissional? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
