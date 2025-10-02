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
import { getPets, deletePet, getTutors } from '@/lib/grooming-api';
import { toast } from 'sonner';

const porteLabels = { PP: 'Mini', P: 'Pequeno', M: 'Médio', G: 'Grande', GG: 'Gigante' };

export default function GroomingPetsIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pets, setPets] = useState(() => getPets());
  const tutors = getTutors();

  const filteredPets = pets.filter((p) => {
    const tutor = tutors.find((t) => t.id === p.tutorId);
    const searchLower = search.toLowerCase();
    return (
      p.nome.toLowerCase().includes(searchLower) ||
      tutor?.nome.toLowerCase().includes(searchLower) ||
      p.raca?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deletePet(deleteId);
    setPets(getPets());
    setDeleteId(null);
    toast.success('Pet excluído');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pets"
        description="Gerencie os pets cadastrados"
        actionLabel="Novo Pet"
        actionIcon={Plus}
        onAction={() => navigate('/erp/grooming/pets/novo')}
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar pets ou tutores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPets.length === 0 && !search ? (
        <EmptyState
          icon={Plus}
          title="Nenhum pet cadastrado"
          description="Comece cadastrando o primeiro pet"
          actionLabel="Novo Pet"
          onAction={() => navigate('/erp/grooming/pets/novo')}
        />
      ) : filteredPets.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum pet encontrado"
          description="Tente ajustar sua busca"
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pet</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Espécie</TableHead>
                <TableHead>Porte</TableHead>
                <TableHead>Temperamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.map((pet) => {
                const tutor = tutors.find((t) => t.id === pet.tutorId);
                return (
                  <TableRow key={pet.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{pet.nome}</span>
                        {pet.raca && (
                          <span className="text-xs text-muted-foreground">
                            {pet.raca}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tutor?.nome || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{pet.especie}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{porteLabels[pet.porte]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pet.temperamento === 'DOCIL'
                            ? 'default'
                            : pet.temperamento === 'AGRESSIVO'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {pet.temperamento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pet.ativo ? 'default' : 'secondary'}>
                        {pet.ativo ? 'Ativo' : 'Inativo'}
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
                            onClick={() => navigate(`/erp/grooming/pets/${pet.id}/editar`)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(pet.id)}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pet?
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
