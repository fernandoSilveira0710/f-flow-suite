import { useState } from 'react';
import { Plus, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

// Default specialties
const defaultSpecialties: Omit<Specialty, 'id' | 'createdAt'>[] = [
  { name: 'Banho', description: 'Serviços de banho para pets', active: true },
  { name: 'Tosa', description: 'Serviços de tosa e corte de pelos', active: true },
  { name: 'Escovação', description: 'Escovação e desembaraço de pelos', active: true },
  { name: 'Corte de Unhas', description: 'Corte e cuidado das unhas', active: true },
  { name: 'Limpeza de Ouvidos', description: 'Limpeza e higienização dos ouvidos', active: true },
  { name: 'Hidratação', description: 'Tratamentos de hidratação para pelos e pele', active: true },
  { name: 'Penteados', description: 'Penteados e acabamentos especiais', active: true },
  { name: 'Tingimento', description: 'Coloração e tingimento de pelos', active: true },
];

const getSpecialties = (): Specialty[] => {
  try {
    const stored = localStorage.getItem('grooming_specialties');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    
    // Initialize with default specialties if none exist
    const initialSpecialties = defaultSpecialties.map(specialty => ({
      ...specialty,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }));
    
    localStorage.setItem('grooming_specialties', JSON.stringify(initialSpecialties));
    return initialSpecialties;
  } catch (error) {
    console.error('Error loading specialties:', error);
    return [];
  }
};

const saveSpecialties = (specialties: Specialty[]) => {
  localStorage.setItem('grooming_specialties', JSON.stringify(specialties));
};

const createSpecialty = (data: Omit<Specialty, 'id' | 'createdAt'>): Specialty => {
  const specialty: Specialty = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  
  const specialties = getSpecialties();
  specialties.push(specialty);
  saveSpecialties(specialties);
  
  return specialty;
};

const updateSpecialty = (id: string, data: Partial<Specialty>): Specialty | null => {
  const specialties = getSpecialties();
  const index = specialties.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  specialties[index] = { ...specialties[index], ...data };
  saveSpecialties(specialties);
  
  return specialties[index];
};

const deleteSpecialty = (id: string): boolean => {
  const specialties = getSpecialties();
  const filtered = specialties.filter(s => s.id !== id);
  
  if (filtered.length === specialties.length) return false;
  
  saveSpecialties(filtered);
  return true;
};

export default function GroomingSpecialtiesIndex() {
  const [specialties, setSpecialties] = useState<Specialty[]>(() => getSpecialties());
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  const filteredSpecialties = specialties.filter(specialty => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      specialty.name.toLowerCase().includes(searchLower) ||
      specialty.description?.toLowerCase().includes(searchLower)
    );
  });

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormActive(true);
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    // Check for duplicate names
    const exists = specialties.some(s => 
      s.name.toLowerCase() === formName.trim().toLowerCase()
    );
    
    if (exists) {
      toast.error('Já existe uma especialidade com este nome');
      return;
    }

    const newSpecialty = createSpecialty({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      active: formActive,
    });

    setSpecialties(getSpecialties());
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success('Especialidade criada com sucesso!');
  };

  const handleEdit = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setFormName(specialty.name);
    setFormDescription(specialty.description || '');
    setFormActive(specialty.active);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSpecialty) return;

    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    // Check for duplicate names (excluding current specialty)
    const exists = specialties.some(s => 
      s.id !== selectedSpecialty.id && 
      s.name.toLowerCase() === formName.trim().toLowerCase()
    );
    
    if (exists) {
      toast.error('Já existe uma especialidade com este nome');
      return;
    }

    const updated = updateSpecialty(selectedSpecialty.id, {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      active: formActive,
    });

    if (updated) {
      setSpecialties(getSpecialties());
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedSpecialty(null);
      toast.success('Especialidade atualizada com sucesso!');
    }
  };

  const handleDelete = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedSpecialty) return;

    const success = deleteSpecialty(selectedSpecialty.id);
    if (success) {
      setSpecialties(getSpecialties());
      toast.success('Especialidade excluída com sucesso!');
    } else {
      toast.error('Erro ao excluir especialidade');
    }

    setIsDeleteDialogOpen(false);
    setSelectedSpecialty(null);
  };

  const handleToggleActive = (specialty: Specialty) => {
    const updated = updateSpecialty(specialty.id, { active: !specialty.active });
    if (updated) {
      setSpecialties(getSpecialties());
      toast.success(`Especialidade ${updated.active ? 'ativada' : 'desativada'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Especialidades</h2>
          <p className="text-muted-foreground">
            Gerencie as especialidades disponíveis para os profissionais
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Especialidade
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar especialidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSpecialties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {search ? 'Nenhuma especialidade encontrada' : 'Nenhuma especialidade cadastrada'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSpecialties.map((specialty) => (
                <TableRow key={specialty.id}>
                  <TableCell className="font-medium">{specialty.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {specialty.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={specialty.active ? 'default' : 'secondary'}>
                      {specialty.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(specialty)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleActive(specialty)}
                        >
                          <Switch className="mr-2 h-4 w-4" />
                          {specialty.active ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(specialty)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Especialidade</DialogTitle>
            <DialogDescription>
              Adicione uma nova especialidade para os profissionais
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Banho, Tosa, Escovação..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descrição da especialidade..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Especialidade</DialogTitle>
            <DialogDescription>
              Edite as informações da especialidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Banho, Tosa, Escovação..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descrição da especialidade..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label htmlFor="edit-active">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Especialidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a especialidade "{selectedSpecialty?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { getSpecialties, createSpecialty, updateSpecialty, deleteSpecialty };