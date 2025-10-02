import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, User, Mail, Phone } from 'lucide-react';
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
import { getTutors, deleteTutor } from '@/lib/grooming-api';
import { toast } from 'sonner';

export default function TutorsIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tutors, setTutors] = useState(() => getTutors());

  const filteredTutors = tutors.filter((t) => {
    const searchLower = search.toLowerCase();
    return (
      t.nome.toLowerCase().includes(searchLower) ||
      t.telefone?.toLowerCase().includes(searchLower) ||
      t.email?.toLowerCase().includes(searchLower) ||
      t.documento?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deleteTutor(deleteId);
    setTutors(getTutors());
    setDeleteId(null);
    toast.success('Tutor excluído');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tutores"
        description="Gerencie os tutores dos pets"
        actionLabel="Novo Tutor"
        actionIcon={Plus}
        onAction={() => navigate('/erp/grooming/tutors/novo')}
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tutores por nome, telefone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredTutors.length === 0 && !search ? (
        <EmptyState
          icon={User}
          title="Nenhum tutor cadastrado"
          description="Comece cadastrando o primeiro tutor"
          actionLabel="Novo Tutor"
          onAction={() => navigate('/erp/grooming/tutors/novo')}
        />
      ) : filteredTutors.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum tutor encontrado"
          description="Tente ajustar sua busca"
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutor</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTutors.map((tutor) => (
                <TableRow key={tutor.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tutor.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {tutor.telefone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {tutor.telefone}
                        </div>
                      )}
                      {tutor.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {tutor.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tutor.documento || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tutor.ativo ? 'default' : 'secondary'}>
                      {tutor.ativo ? 'Ativo' : 'Inativo'}
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
                          onClick={() => navigate(`/erp/grooming/tutors/${tutor.id}/editar`)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(tutor.id)}
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
              Tem certeza que deseja excluir este tutor?
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
