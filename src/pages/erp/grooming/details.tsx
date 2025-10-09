import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, PawPrint, DollarSign, FileText, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getGroomTicketById, deleteGroomTicket, getTutorById, getPetById } from '@/lib/grooming-api';
import { GroomingTabs } from '@/components/erp/grooming-tabs';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function GroomingTicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate('/erp/grooming');
    return null;
  }

  const ticket = getGroomTicketById(id);
  
  if (!ticket) {
    toast.error('Ticket não encontrado');
    navigate('/erp/grooming');
    return null;
  }

  const tutor = getTutorById(ticket.tutorId);
  const pet = getPetById(ticket.petId);

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este ticket?')) {
      deleteGroomTicket(id);
      toast.success('Ticket excluído com sucesso');
      navigate('/erp/grooming');
    }
  };

  const totalItems = ticket?.items?.reduce((sum, item) => sum + ((item?.subtotal || (item?.price || 0) * (item?.qty || 0))), 0) || 0;

  return (
    <div className="space-y-6">
      <GroomingTabs />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/erp/grooming')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ticket #{ticket.code}</h1>
            <p className="text-muted-foreground">
              Criado em {new Date(ticket.createdAt || '').toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={statusColors[ticket.status]}>
            {statusLabels[ticket.status]}
          </Badge>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Pet e Tutor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Pet e Tutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Pet</h4>
              <p className="font-medium">{pet?.nome || 'Pet não encontrado'}</p>
              {pet && (
                <p className="text-sm text-muted-foreground">
                  {pet.especie} • {pet.raca} • {pet.porte}
                </p>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Tutor</h4>
              <p className="font-medium">{tutor?.nome || 'Tutor não encontrado'}</p>
              {tutor?.telefone && (
                <p className="text-sm text-muted-foreground">{tutor.telefone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Ticket */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                <Badge className={statusColors[ticket.status]}>
                  {statusLabels[ticket.status]}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Valor Total</h4>
                <p className="font-medium text-lg">
                  R$ {(ticket?.totalPrice || 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Criado em</h4>
                <p className="text-sm">
                  {new Date(ticket.createdAt || '').toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Atualizado em</h4>
                <p className="text-sm">
                  {new Date(ticket.updatedAt || '').toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            {ticket.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
                  <p className="text-sm">{ticket.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Itens do Serviço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Itens do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(ticket?.items || []).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantidade: {item.qty} • Preço unitário: R$ {(item?.price || 0).toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">
                  R$ {((item?.subtotal || (item?.price || 0) * (item?.qty || 0))).toFixed(2)}
                </p>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-between items-center font-medium text-lg">
              <span>Total</span>
              <span>R$ {totalItems.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}