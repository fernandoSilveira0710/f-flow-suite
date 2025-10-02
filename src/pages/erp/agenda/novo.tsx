import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Briefcase, DollarSign } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getCustomers, getServices, getStaff, createAppointment, getSchedulePrefs } from '@/lib/schedule-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function NovoAgendamento() {
  const navigate = useNavigate();
  const customers = getCustomers().filter(c => c.ativo);
  const services = getServices().filter(s => s.ativo);
  const staff = getStaff().filter(s => s.ativo);
  const prefs = getSchedulePrefs();

  const [customerId, setCustomerId] = useState('');
  const [petId, setPetId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [notas, setNotas] = useState('');
  const [sinal, setSinal] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<string>('');

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedService = services.find(s => s.id === serviceId);

  // Calcular horário de término
  const endTime = useMemo(() => {
    if (!selectedService || !startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = setMinutes(setHours(new Date(), hours), minutes);
    const end = addMinutes(start, selectedService.duracaoMin);
    return format(end, 'HH:mm');
  }, [selectedService, startTime]);

  const handleStaffToggle = (staffId: string) => {
    setStaffIds(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || !serviceId || !date || !startTime || staffIds.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const customer = customers.find(c => c.id === customerId)!;
    const service = services.find(s => s.id === serviceId)!;

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = setMinutes(setHours(date, hours), minutes);
    const endDate = addMinutes(startDate, service.duracaoMin);

    const newAppointment = {
      customerId,
      customerNome: customer.nome,
      customerContato: customer.telefone || customer.email,
      petId: petId || undefined,
      serviceId,
      serviceNome: service.nome,
      staffIds,
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
      status: (prefs.confirmarAuto ? 'CONFIRMADO' : 'AGENDADO') as 'CONFIRMADO' | 'AGENDADO',
      origem: 'INTERNO' as const,
      notas: notas.trim() || undefined,
      pagamento: (sinal || metodoPagamento) ? {
        metodo: metodoPagamento as any,
        sinal: sinal ? parseFloat(sinal) : undefined,
      } : undefined,
    };

    createAppointment(newAppointment);
    toast.success('Agendamento criado com sucesso');
    navigate('/erp/agenda');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/erp/agenda')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Agendamento</h1>
          <p className="text-muted-foreground mt-1">
            Crie um novo agendamento para um cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 space-y-6">
          {/* Cliente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Cliente</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} {c.telefone && `- ${c.telefone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer?.pets && selectedCustomer.pets.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="pet">Pet (opcional)</Label>
                  <div className="flex gap-2">
                    <Select value={petId} onValueChange={setPetId}>
                      <SelectTrigger id="pet">
                        <SelectValue placeholder="Selecione o pet" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {selectedCustomer.pets.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} {p.especie && `(${p.especie})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {petId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPetId('')}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Serviço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Serviço</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">
                Serviço <span className="text-destructive">*</span>
              </Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} - {s.duracaoMin}min - R$ {s.precoBase.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService && (
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary">
                  Duração: {selectedService.duracaoMin} min
                </Badge>
                <Badge variant="secondary">
                  Preço: R$ {selectedService.precoBase.toFixed(2)}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Profissionais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                Profissional(is) <span className="text-destructive">*</span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {staff.map((s) => (
                <Badge
                  key={s.id}
                  variant={staffIds.includes(s.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleStaffToggle(s.id)}
                >
                  {s.nome}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Data e Hora */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Data e Horário</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  Data <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Início <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Término</Label>
                <Input value={endTime} readOnly className="bg-muted" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Pagamento (opcional)</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sinal">Sinal (R$)</Label>
                <Input
                  id="sinal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sinal}
                  onChange={(e) => setSinal(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo">Método</Label>
                <div className="flex gap-2">
                  <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                    <SelectTrigger id="metodo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="DEBIT">Débito</SelectItem>
                      <SelectItem value="CREDIT">Crédito</SelectItem>
                      <SelectItem value="CASH">Dinheiro</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {metodoPagamento && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMetodoPagamento('')}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notas">Observações</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Informações adicionais sobre o agendamento"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/erp/agenda')}
          >
            Cancelar
          </Button>
          <Button type="submit">Criar Agendamento</Button>
        </div>
      </form>
    </div>
  );
}
