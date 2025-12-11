import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { getUsers, getRoles, updateRole, deleteRole, createRole, ALL_PERMISSIONS, Role } from '@/lib/settings-api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useEntitlements } from '@/hooks/use-entitlements';

export default function PapeisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const [users, roles] = await Promise.all([getUsers(), getRoles()]);
        const current = users.find(u => u.email === user?.email);
        const role = roles.find(r => r.id === current?.roleId);
        const hasDanger = !!role?.permissions?.includes('settings:danger');
        if (!hasDanger) {
          toast.error('Acesso restrito: apenas admin pode gerenciar papéis.');
          navigate('/erp/settings/organization');
        }
      } catch {
        // Em caso de erro, restringe por segurança
        toast.error('Não foi possível validar permissões.');
        navigate('/erp/settings/organization');
      }
    };
    checkAdmin();
  }, [navigate, user]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ nome: '', permissions: [] as string[] });
  const [search, setSearch] = useState('');
  const { entitlements } = useEntitlements();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const data = await getRoles();
    setRoles(data);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({ nome: role.nome, permissions: role.permissions });
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ nome: '', permissions: [] });
    setShowDialog(true);
  };

  const askDelete = (role: Role) => {
    setDeletingRole(role);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        toast.success('Papel atualizado com sucesso');
      } else {
        if (!formData.nome.trim()) {
          toast.error('Informe um nome para o papel');
          return;
        }
        await createRole({ nome: formData.nome.trim(), permissions: formData.permissions });
        toast.success('Papel criado com sucesso');
      }
      setShowDialog(false);
      setEditingRole(null);
      loadRoles();
    } catch (error) {
      toast.error('Erro ao salvar papel');
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const isPermissionBlocked = (permId: string) => {
    if (permId.startsWith('pet:') && !entitlements.banho_tosa) return true;
    if (permId.startsWith('reports:') && !entitlements.reports) return true;
    return false;
  };

  const filteredPermissions = ALL_PERMISSIONS.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.grupo.toLowerCase().includes(search.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.grupo]) acc[perm.grupo] = [];
    acc[perm.grupo].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Papéis & Permissões</h1>
        <p className="text-muted-foreground mt-1">Gerencie os papéis e suas permissões</p>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Criar papel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {role.nome}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => askDelete(role)}
                    aria-label="Excluir papel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {role.permissions.length} permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm.split(':')[0]}
                  </Badge>
                ))}
                {role.permissions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{role.permissions.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? `Editar Papel: ${editingRole?.nome}` : 'Criar novo papel'}</DialogTitle>
            <DialogDescription>
              Defina o nome e selecione as permissões para este papel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nome do papel</Label>
              <Input
                id="role-name"
                placeholder="Ex.: Vendedor, Estoquista"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <Input
              placeholder="Buscar permissões..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {Object.entries(groupedPermissions).map(([grupo, perms]) => (
              <div key={grupo} className="space-y-2">
                <h3 className="font-semibold text-sm">{grupo}</h3>
                <div className="space-y-2 pl-4">
                  {perms.map((perm) => {
                    const blocked = isPermissionBlocked(perm.id);
                    return (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.id}
                          checked={formData.permissions.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          disabled={blocked}
                        />
                        <Label
                          htmlFor={perm.id}
                          className={blocked ? 'opacity-50' : ''}
                        >
                          {perm.nome}
                          {blocked && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Requer Pro/Max
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o papel <strong>{deletingRole?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingRole) return;
                try {
                  // Impedir exclusão se houver usuários vinculados
                  const users = await getUsers();
                  const inUse = users.some(u => u.roleId === deletingRole.id);
                  if (inUse) {
                    toast.error('Não é possível excluir: existem usuários vinculados a este papel.');
                    return;
                  }
                  await deleteRole(deletingRole.id);
                  toast.success('Papel excluído com sucesso');
                  setShowDeleteDialog(false);
                  setDeletingRole(null);
                  loadRoles();
                } catch (error) {
                  toast.error('Erro ao excluir papel');
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
