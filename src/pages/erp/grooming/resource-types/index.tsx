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

export interface ResourceType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

// Funções para gerenciar tipos de recursos no localStorage
const getResourceTypes = (): ResourceType[] => {
  const stored = localStorage.getItem('grooming_resource_types');
  if (!stored) {
    // Tipos padrão
    const defaultTypes: ResourceType[] = [
      {
        id: '1',
        name: 'BOX',
        description: 'Box individual para banho e tosa',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'MESA',
        description: 'Mesa de tosa',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'SECADOR',
        description: 'Secador profissional',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('grooming_resource_types', JSON.stringify(defaultTypes));
    return defaultTypes;
  }
  return JSON.parse(stored);
};

const saveResourceTypes = (types: ResourceType[]) => {
  localStorage.setItem('grooming_resource_types', JSON.stringify(types));
};

const createResourceType = (data: Omit<ResourceType, 'id' | 'createdAt'>): ResourceType => {
  const newType: ResourceType = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  const types = getResourceTypes();
  types.push(newType);
  saveResourceTypes(types);
  
  return newType;
};

const updateResourceType = (id: string, data: Partial<ResourceType>): ResourceType | null => {
  const types = getResourceTypes();
  const index = types.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  types[index] = { ...types[index], ...data };
  saveResourceTypes(types);
  
  return types[index];
};

const deleteResourceType = (id: string): boolean => {
  const types = getResourceTypes();
  const filtered = types.filter(t => t.id !== id);
  
  if (filtered.length === types.length) return false;
  
  saveResourceTypes(filtered);
  return true;
};

export default function GroomingResourceTypesIndex() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editType, setEditType] = useState<ResourceType | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [resourceTypes, setResourceTypes] = useState(() => getResourceTypes());

  // Form state for add/edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  const filteredTypes = resourceTypes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = () => {
    if (!deleteId) return;
    
    if (deleteResourceType(deleteId)) {
      setResourceTypes(getResourceTypes());
      toast.success('Tipo de recurso excluído');
    } else {
      toast.error('Erro ao excluir tipo de recurso');
    }
    
    setDeleteId(null);
  };

  const handleEdit = (type: ResourceType) => {
    setEditType(type);
    setFormName(type.name);
    setFormDescription(type.description || '');
    setFormActive(type.active);
  };

  const handleAdd = () => {
    setShowAddDialog(true);
    setFormName('');
    setFormDescription('');
    setFormActive(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editType) {
        // Editando
        updateResourceType(editType.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          active: formActive,
        });
        toast.success('Tipo de recurso atualizado');
        setEditType(null);
      } else {
        // Criando
        createResourceType({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          active: formActive,
        });
        toast.success('Tipo de recurso criado');
        setShowAddDialog(false);
      }
      
      setResourceTypes(getResourceTypes());
      setFormName('');
      setFormDescription('');
      setFormActive(true);
    } catch (error) {
      toast.error('Erro ao salvar tipo de recurso');
    }
  };

  const handleCancel = () => {
    setEditType(null);
    setShowAddDialog(false);
    setFormName('');
    setFormDescription('');
    setFormActive(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tipos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {filteredTypes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {search ? 'Nenhum tipo encontrado' : 'Nenhum tipo cadastrado'}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.active ? 'default' : 'secondary'}>
                      {type.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(type.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(type)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(type.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tipo de Recurso</DialogTitle>
            <DialogDescription>
              Cadastre um novo tipo de recurso físico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: BOX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Box individual para banho e tosa"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label htmlFor="active">Tipo ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Salvar Tipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editType} onOpenChange={() => setEditType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Recurso</DialogTitle>
            <DialogDescription>
              Altere as informações do tipo de recurso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: BOX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Box individual para banho e tosa"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
              <Label htmlFor="edit-active">Tipo ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tipo de recurso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O tipo de recurso será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export das funções para uso em outros componentes
export { getResourceTypes, createResourceType, updateResourceType, deleteResourceType };