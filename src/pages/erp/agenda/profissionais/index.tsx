import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Pencil, Trash2, User, Box } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getStaff, deleteStaff, getServices, type Staff } from '@/lib/schedule-api';

export default function ProfissionaisIndex() {
  const [staff, setStaff] = useState<Staff[]>(getStaff());
  const [search, setSearch] = useState('');
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'PROFISSIONAL' | 'RECURSO'>('all');
  const { toast } = useToast();
  const services = getServices();

  const filteredStaff = useMemo(() => {
    let result = staff;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(s => s.nome.toLowerCase().includes(lower));
    }

    if (filterType !== 'all') {
      result = result.filter(s => s.tipo === filterType);
    }

    return result;
  }, [staff, search, filterType]);

  const handleDelete = (staffMember: Staff) => {
    if (deleteStaff(staffMember.id)) {
      setStaff(getStaff());
      toast({
        title: `${staffMember.tipo === 'PROFISSIONAL' ? 'Profissional' : 'Recurso'} excluído`,
        description: `${staffMember.nome} foi removido com sucesso`,
      });
    }
    setStaffToDelete(null);
  };

  const getServiceNames = (serviceIds?: string[]) => {
    if (!serviceIds || serviceIds.length === 0) return 'Todos';
    const names = serviceIds
      .map(id => services.find(s => s.id === id)?.nome)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Nenhum';
  };

  const profissionais = filteredStaff.filter(s => s.tipo === 'PROFISSIONAL');
  const recursos = filteredStaff.filter(s => s.tipo === 'RECURSO');

  if (staff.length === 0) {
    return (
      <>
        <PageHeader
          title="Profissionais & Recursos"
          description="Gerencie profissionais e recursos da agenda"
        />
        <EmptyState
          icon={Plus}
          title="Nenhum profissional ou recurso cadastrado"
          description="Comece criando seu primeiro profissional ou recurso"
          actionLabel="Novo Profissional/Recurso"
          onAction={() => {}}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profissionais & Recursos"
        description={`${profissionais.length} profissionais e ${recursos.length} recursos`}
      />

      {/* Search and actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button asChild>
          <Link to="/erp/agenda/profissionais/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)}>
        <TabsList>
          <TabsTrigger value="all">Todos ({staff.length})</TabsTrigger>
          <TabsTrigger value="PROFISSIONAL">
            <User className="mr-2 h-4 w-4" />
            Profissionais ({profissionais.length})
          </TabsTrigger>
          <TabsTrigger value="RECURSO">
            <Box className="mr-2 h-4 w-4" />
            Recursos ({recursos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterType} className="mt-6">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map(staffMember => (
                    <TableRow key={staffMember.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                            style={{
                              backgroundColor: staffMember.cores?.agenda || '#6B7280',
                            }}
                          >
                            {staffMember.tipo === 'PROFISSIONAL' ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <Box className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{staffMember.nome}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            staffMember.tipo === 'PROFISSIONAL' ? 'default' : 'secondary'
                          }
                        >
                          {staffMember.tipo === 'PROFISSIONAL' ? 'Profissional' : 'Recurso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {getServiceNames(staffMember.funcoes)}
                      </TableCell>
                      <TableCell>
                        {staffMember.capacidadeSimultanea
                          ? `${staffMember.capacidadeSimultanea}x`
                          : '1x'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={staffMember.ativo ? 'default' : 'secondary'}>
                          {staffMember.ativo ? 'Ativo' : 'Inativo'}
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
                              <Link to={`/erp/agenda/profissionais/${staffMember.id}/editar`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStaffToDelete(staffMember)}
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
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!staffToDelete} onOpenChange={() => setStaffToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {staffToDelete?.tipo === 'PROFISSIONAL' ? 'Profissional' : 'Recurso'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{staffToDelete?.nome}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => staffToDelete && handleDelete(staffToDelete)}
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
