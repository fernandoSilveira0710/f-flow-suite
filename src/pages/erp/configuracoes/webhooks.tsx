import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook, Webhook } from '@/lib/settings-api';

const AVAILABLE_EVENTS = [
  { id: 'license.activated', label: 'Licença Ativada' },
  { id: 'license.revoked', label: 'Licença Revogada' },
  { id: 'license.expired', label: 'Licença Expirada' },
  { id: 'plan.changed', label: 'Plano Alterado' },
  { id: 'user.created', label: 'Usuário Criado' },
  { id: 'user.deleted', label: 'Usuário Removido' },
  { id: 'product.created', label: 'Produto Criado' },
  { id: 'product.updated', label: 'Produto Atualizado' },
  { id: 'order.created', label: 'Pedido Criado' },
  { id: 'order.completed', label: 'Pedido Concluído' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({ url: '', eventos: [] as string[], ativo: true });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    const data = await getWebhooks();
    setWebhooks(data);
  };

  const handleCreate = () => {
    setFormData({ url: '', eventos: [], ativo: true });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.url.trim()) {
      toast.error('URL do webhook é obrigatória');
      return;
    }
    if (formData.eventos.length === 0) {
      toast.error('Selecione pelo menos um evento');
      return;
    }
    try {
      await createWebhook(formData);
      toast.success('Webhook criado com sucesso');
      setShowDialog(false);
      loadWebhooks();
    } catch (error) {
      toast.error('Erro ao criar webhook');
    }
  };

  const toggleWebhook = async (webhook: Webhook) => {
    try {
      await updateWebhook(webhook.id, { ativo: !webhook.ativo });
      toast.success(`Webhook ${!webhook.ativo ? 'ativado' : 'desativado'} com sucesso`);
      loadWebhooks();
    } catch (error) {
      toast.error('Erro ao atualizar webhook');
    }
  };

  const handleDelete = async () => {
    if (!deletingWebhook) return;
    try {
      await deleteWebhook(deletingWebhook.id);
      toast.success('Webhook removido com sucesso');
      setShowDeleteDialog(false);
      setDeletingWebhook(null);
      loadWebhooks();
    } catch (error) {
      toast.error('Erro ao remover webhook');
    }
  };

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      eventos: prev.eventos.includes(eventId)
        ? prev.eventos.filter(e => e !== eventId)
        : [...prev.eventos, eventId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Configure notificações automáticas para eventos do sistema</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Eventos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum webhook configurado
                </TableCell>
              </TableRow>
            ) : (
              webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-mono text-sm">{webhook.url}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.eventos.slice(0, 2).map((evt) => (
                        <Badge key={evt} variant="secondary" className="text-xs">
                          {evt.split('.')[0]}
                        </Badge>
                      ))}
                      {webhook.eventos.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.eventos.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={webhook.ativo}
                      onCheckedChange={() => toggleWebhook(webhook)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingWebhook(webhook);
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
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Webhook</DialogTitle>
            <DialogDescription>
              Configure um endpoint para receber notificações de eventos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Webhook</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://seu-dominio.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Eventos</Label>
              <div className="grid gap-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={formData.eventos.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <Label htmlFor={event.id} className="font-normal">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o webhook <strong>{deletingWebhook?.url}</strong>?
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
