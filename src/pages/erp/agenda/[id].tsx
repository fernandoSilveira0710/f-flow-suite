import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, XCircle, Calendar as CalendarIcon, User, Phone, Mail, Clock, DollarSign, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import { getAppointmentById, updateAppointment, getCustomerById, getServiceById, getStaff } from '@/lib/schedule-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusColors = {
  AGENDADO: 'bg-blue-500',
  CONFIRMADO: 'bg-green-500',
  CHECKIN: 'bg-purple-500',
  CONCLUIDO: 'bg-gray-500',
  CANCELADO: 'bg-red-500',
  NO_SHOW: 'bg-orange-500',
};

const statusLabels = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  CHECKIN: 'Check-in Realizado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  NO_SHOW: 'Não Compareceu',
};

export default function AgendamentoDetalhe() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  useEffect(() => {
    if (!id) return;

    const apt = getAppointmentById(id);
    if (!apt) {
      toast.error('Agendamento não encontrado');
      navigate('/erp/agenda');
      return;
    }

    setAppointment(apt);
    setLoading(false);
  }, [id, navigate]);

  const handleCheckin = () => {
    if (!id) return;
    updateAppointment(id, { status: 'CHECKIN' });
    setAppointment({ ...appointment, status: 'CHECKIN' });
    toast.success('Check-in realizado');
  };

  const handleComplete = () => {
    if (!id) return;
    updateAppointment(id, { status: 'CONCLUIDO' });
    toast.success('Agendamento concluído');
    navigate('/erp/pdv');
  };

  const handleCancel = () => {
    if (!id) return;
    updateAppointment(id, { status: 'CANCELADO' });
    toast.success('Agendamento cancelado');
    navigate('/erp/agenda');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!appointment) return null;

  const customer = getCustomerById(appointment.customerId);
  const service = getServiceById(appointment.serviceId);
  const allStaff = getStaff();
  const appointmentStaff = allStaff.filter(s => appointment.staffIds.includes(s.id));

  const canCheckin = appointment.status === 'AGENDADO' || appointment.status === 'CONFIRMADO';
  const canComplete = appointment.status === 'CHECKIN';
  const canCancel = appointment.status !== 'CONCLUIDO' && appointment.status !== 'CANCELADO';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/erp/agenda')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Agendamento</h1>
            <p className="text-muted-foreground mt-1">
              #{appointment.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/erp/agenda/${id}/editar`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informações Principais */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn('w-3 h-3 rounded-full', statusColors[appointment.status])} />
                <span className="text-xl font-semibold">{statusLabels[appointment.status]}</span>
              </div>
              <Badge variant="secondary">{appointment.origem || 'INTERNO'}</Badge>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Cliente</h3>
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium">{appointment.customerNome}</div>
                {customer?.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                )}
                {customer?.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {customer.telefone}
                  </div>
                )}
                {appointment.petId && customer?.pets && (
                  <div className="text-sm text-muted-foreground">
                    Pet: {customer.pets.find(p => p.id === appointment.petId)?.nome}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Data e Horário</h3>
              </div>
              <div className="space-y-2">
                <div className="text-lg">
                  {format(parseISO(appointment.startISO), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(parseISO(appointment.startISO), 'HH:mm')} - {format(parseISO(appointment.endISO), 'HH:mm')}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Serviço</h3>
              <div className="space-y-2">
                <div className="text-lg">{appointment.serviceNome}</div>
                {service && (
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {service.duracaoMin} minutos
                    </Badge>
                    <Badge variant="secondary">
                      R$ {service.precoBase.toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Profissional(is)</h3>
              <div className="flex flex-wrap gap-2">
                {appointmentStaff.map(s => (
                  <Badge key={s.id} variant="outline">
                    {s.nome}
                  </Badge>
                ))}
              </div>
            </div>

            {appointment.pagamento && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Pagamento</h3>
                  </div>
                  <div className="space-y-2">
                    {appointment.pagamento.sinal && (
                      <div className="text-sm">
                        Sinal: R$ {appointment.pagamento.sinal.toFixed(2)}
                      </div>
                    )}
                    {appointment.pagamento.metodo && (
                      <Badge variant="secondary">
                        {appointment.pagamento.metodo}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {appointment.notas && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Observações</h3>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {appointment.notas}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Ações</h3>

            {canCheckin && (
              <Button className="w-full" onClick={handleCheckin}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Fazer Check-in
              </Button>
            )}

            {canComplete && (
              <Button className="w-full" onClick={() => setShowCompleteDialog(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir e Abrir PDV
              </Button>
            )}

            {canCancel && (
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Agendamento
              </Button>
            )}

            <Separator />

            <Button variant="outline" className="w-full" onClick={() => toast.info('Lembrete agendado (mock)')}>
              Enviar Lembrete
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Cancelar */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancelar Agendamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Concluir */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Ao concluir, o agendamento será marcado como concluído e você será redirecionado para o PDV para finalizar a venda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>Concluir e Abrir PDV</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
