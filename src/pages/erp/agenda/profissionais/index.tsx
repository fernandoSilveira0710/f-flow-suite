import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Pencil, Trash2, User, Box } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { AgendaTabs } from '@/components/erp/agenda-tabs';
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
import { getProfessionals, deleteProfessional, type ProfessionalResponseDto } from '@/lib/professionals-api';
import { getServices } from '@/lib/schedule-api';

export default function ProfissionaisIndex() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<ProfessionalResponseDto[]>(() => {
    const professionalsData = getProfessionals();
    return Array.isArray(professionalsData) ? professionalsData : [];
  });
  const [search, setSearch] = useState('');
  const [professionalToDelete, setProfessionalToDelete] = useState<ProfessionalResponseDto | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'Professional' | 'Resource'>('all');
  const { toast } = useToast();
  const services = getServices();

  const filteredProfessionals = useMemo(() => {
    let result = Array.isArray(professionals) ? professionals : [];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(lower));
    }

    if (filterType !== 'all') {
      result = result.filter(s => s.role === filterType);
    }

    return result;
  }, [professionals, search, filterType]);

  const handleDelete = (professional: ProfessionalResponseDto) => {
    if (deleteProfessional(professional.id)) {
      setProfessionals(getProfessionals());
      toast({
        title: `${professional.role === 'Professional' ? 'Profissional' : 'Recurso'} excluído`,
        description: `${professional.name} foi removido com sucesso`,
      });
    }
    setProfessionalToDelete(null);
  };

  const getServiceNames = (serviceIds?: string[]) => {
    if (!serviceIds || serviceIds.length === 0) return 'Todos';
    const names = serviceIds
      .map(id => services.find(s => s.id === id)?.nome)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Nenhum';
  };

  const profissionais = filteredProfessionals.filter(s => s.role === 'Professional');
  const recursos = filteredProfessionals.filter(s => s.role === 'Resource');

  if (professionals.length === 0) {
    return (
      <>
        <AgendaTabs />
        <PageHeader
          title="Profissionais & Recursos"
          description="Gerencie profissionais e recursos da agenda"
        />
        <EmptyState
          icon={Plus}
          title="Nenhum profissional ou recurso cadastrado"
          description="Comece criando seu primeiro profissional ou recurso"
          actionLabel="Novo Profissional/Recurso"
          onAction={() => navigate('/erp/agenda/profissionais/novo')}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <AgendaTabs />
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
          <TabsTrigger value="all">Todos ({professionals.length})</TabsTrigger>
          <TabsTrigger value="Professional">
            <User className="mr-2 h-4 w-4" />
            Profissionais ({profissionais.length})
          </TabsTrigger>
          <TabsTrigger value="Resource">
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
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessionals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfessionals.map(professional => (
                    <TableRow key={professional.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white bg-gray-500"
                          >
                            {professional.role === 'Professional' ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <Box className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{professional.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            professional.role === 'Professional' ? 'default' : 'secondary'
                          }
                        >
                          {professional.role === 'Professional' ? 'Profissional' : 'Recurso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={professional.active ? 'default' : 'secondary'}>
                          {professional.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(professional.createdAt).toLocaleDateString('pt-BR')}
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
                              <Link to={`/erp/agenda/profissionais/${professional.id}/editar`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setProfessionalToDelete(professional)}
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
      <AlertDialog open={!!professionalToDelete} onOpenChange={() => setProfessionalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {professionalToDelete?.role === 'Professional' ? 'Profissional' : 'Recurso'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{professionalToDelete?.name}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => professionalToDelete && handleDelete(professionalToDelete)}
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
