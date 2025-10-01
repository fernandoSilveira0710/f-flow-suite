import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';
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
import { useEntitlements } from '@/hooks/use-entitlements';
import { getRoles, updateRole, ALL_PERMISSIONS, Role } from '@/lib/settings-api';

export default function PapeisPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
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

  const handleSave = async () => {
    if (!editingRole) return;
    try {
      await updateRole(editingRole.id, formData);
      toast.success('Papel atualizado com sucesso');
      setShowDialog(false);
      loadRoles();
    } catch (error) {
      toast.error('Erro ao atualizar papel');
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {role.nome}
                <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                  <Pencil className="h-4 w-4" />
                </Button>
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
            <DialogTitle>Editar Papel: {editingRole?.nome}</DialogTitle>
            <DialogDescription>
              Selecione as permissões para este papel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
    </div>
  );
}
