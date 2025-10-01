import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getApiKeys, createApiKey, deleteApiKey, ApiKey } from '@/lib/settings-api';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const data = await getApiKeys();
    setKeys(data);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error('Nome da chave é obrigatório');
      return;
    }
    try {
      const { fullToken } = await createApiKey(newKeyName);
      setGeneratedToken(fullToken);
      setShowCreateDialog(false);
      setShowTokenDialog(true);
      setNewKeyName('');
      loadKeys();
    } catch (error) {
      toast.error('Erro ao criar chave de API');
    }
  };

  const handleDelete = async () => {
    if (!deletingKey) return;
    try {
      await deleteApiKey(deletingKey.id);
      toast.success('Chave de API removida com sucesso');
      setShowDeleteDialog(false);
      setDeletingKey(null);
      loadKeys();
    } catch (error) {
      toast.error('Erro ao remover chave de API');
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    toast.success('Token copiado para a área de transferência');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas chaves de acesso à API</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Gerar Nova Chave
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Token (Preview)</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhuma chave de API criada
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.nome}</TableCell>
                  <TableCell>
                    <code className="text-xs">{key.tokenPrefix}</code>
                  </TableCell>
                  <TableCell>
                    {new Date(key.criadoEm).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingKey(key);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Nova Chave de API</DialogTitle>
            <DialogDescription>
              Crie uma nova chave de API para integração com sistemas externos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Nome da Chave</Label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ex: Integração E-commerce"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Gerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token Display Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave de API Criada</DialogTitle>
            <DialogDescription>
              Copie esta chave agora. Ela não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {generatedToken}
            </div>
            <Button onClick={copyToken} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Token
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTokenDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a chave <strong>{deletingKey?.nome}</strong>?
              Aplicações usando esta chave perderão acesso à API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
