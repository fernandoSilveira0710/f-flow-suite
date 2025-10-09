import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntitlements } from '@/hooks/use-entitlements';
import { UpgradeDialog } from '@/components/erp/upgrade-dialog';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getRoles, 
  getSeats,
  createSeat,
  updateSeat,
  deleteSeat,
  User,
  Seat 
} from '@/lib/settings-api';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [roles, setRoles] = useState<{ id: string; nome: string }[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deletingSeat, setDeletingSeat] = useState<Seat | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', roleId: '', ativo: true });
  const { entitlements } = useEntitlements();

  useEffect(() => {
    loadData();
  }, []);

  // Escutar mudanças de plano
  useEffect(() => {
    const handlePlanChange = () => {
      // Recarregar entitlements quando o plano mudar
      window.location.reload();
    };

    window.addEventListener('planChanged', handlePlanChange);
    return () => window.removeEventListener('planChanged', handlePlanChange);
  }, []);

  const loadData = async () => {
    const [usersData, rolesData, seatsData] = await Promise.all([getUsers(), getRoles(), getSeats()]);
    setUsers(usersData);
    setRoles(rolesData);
    setSeats(seatsData);
  };

  const handleCreate = () => {
    if (activeTab === 'users') {
      const activeUsers = users.filter(u => u.ativo).length;
      if (activeUsers >= entitlements.seatLimit) {
        setShowUpgradeDialog(true);
        return;
      }
      setEditingUser(null);
      setFormData({ nome: '', email: '', roleId: roles[0]?.id || '', ativo: true });
      setShowDialog(true);
    } else {
      setEditingSeat(null);
      setFormData({ nome: '', email: '', roleId: roles[0]?.id || '', ativo: true });
      setShowDialog(true);
    }
  };

  const handleEdit = (item: User | Seat) => {
    if (activeTab === 'users') {
      const user = item as User;
      setEditingUser(user);
      setFormData({ nome: user.nome, email: user.email, roleId: user.roleId, ativo: user.ativo });
    } else {
      const seat = item as Seat;
      setEditingSeat(seat);
      setFormData({ nome: seat.nome, email: '', roleId: seat.roleId, ativo: seat.ativo });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'users') {
        if (editingUser) {
          await updateUser(editingUser.id, formData);
          toast.success('Usuário atualizado com sucesso');
        } else {
          await createUser(formData);
          toast.success('Usuário criado com sucesso');
        }
      } else {
        if (editingSeat) {
          await updateSeat(editingSeat.id, { nome: formData.nome, roleId: formData.roleId, ativo: formData.ativo });
          toast.success('Assento atualizado com sucesso');
        } else {
          await createSeat({ nome: formData.nome, roleId: formData.roleId, ativo: formData.ativo });
          toast.success('Assento criado com sucesso');
        }
      }
      setShowDialog(false);
      loadData();
    } catch (error) {
      toast.error(`Erro ao salvar ${activeTab === 'users' ? 'usuário' : 'assento'}`);
    }
  };

  const handleDelete = async () => {
    try {
      if (activeTab === 'users' && deletingUser) {
        await deleteUser(deletingUser.id);
        toast.success('Usuário excluído com sucesso');
      } else if (activeTab === 'seats' && deletingSeat) {
        await deleteSeat(deletingSeat.id);
        toast.success('Assento excluído com sucesso');
      }
      setShowDeleteDialog(false);
      setDeletingUser(null);
      setDeletingSeat(null);
      loadData();
    } catch (error) {
      toast.error(`Erro ao excluir ${activeTab === 'users' ? 'usuário' : 'assento'}`);
    }
  };

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSeats = seats.filter(s =>
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  const activeUsers = users.filter(u => u.ativo).length;
  const activeSeats = seats.filter(s => s.ativo).length;

  const currentCount = activeTab === 'users' ? users.length : seats.length;
  const maxCount = entitlements.seatLimit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Usuários & Assentos</h1>
          <Badge variant="secondary" className="text-sm">
            {currentCount} de {maxCount} {activeTab === 'users' ? 'usuários' : 'assentos'} em uso
          </Badge>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'users' ? 'Novo Usuário' : 'Novo Assento'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="seats" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Assentos
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <Input
            placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : 'assentos'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <TabsContent value="users" className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {roles.find(r => r.id === user.roleId)?.nome || user.roleId}
                    </TableCell>
                    <TableCell>
                      {user.ativo ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingUser(user);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="seats" className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeats.map((seat) => (
                  <TableRow key={seat.id}>
                    <TableCell className="font-medium">{seat.nome}</TableCell>
                    <TableCell>
                      {roles.find(r => r.id === seat.roleId)?.nome || seat.roleId}
                    </TableCell>
                    <TableCell>
                      {seat.ativo ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(seat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingSeat(seat);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* User/Seat Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'users' 
                ? (editingUser ? 'Editar Usuário' : 'Novo Usuário')
                : (editingSeat ? 'Editar Assento' : 'Novo Assento')
              }
            </DialogTitle>
            <DialogDescription>
              Preencha os dados {activeTab === 'users' ? 'do usuário' : 'do assento'} abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            {activeTab === 'users' && (
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="roleId">Papel</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger id="roleId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>
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
              Tem certeza que deseja remover {activeTab === 'users' ? 'o usuário' : 'o assento'} <strong>
                {activeTab === 'users' ? deletingUser?.nome : deletingSeat?.nome}
              </strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature="Usuários adicionais"
        requiredPlan="Pro ou Max"
      />
    </div>
  );
}
