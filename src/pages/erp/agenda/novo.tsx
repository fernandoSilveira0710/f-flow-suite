import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, User, Briefcase, DollarSign, Check, ChevronsUpDown, Plus } from 'lucide-react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { getCustomers, getServices, getStaff, createAppointment, getSchedulePrefs } from '@/lib/schedule-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function NovoAgendamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customers = getCustomers().filter(c => c.ativo);
  const services = getServices().filter(s => s.ativo);
  const allStaff = getStaff().filter(s => s.ativo);
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

  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  // Pre-fill from URL
  useEffect(() => {
    const customerIdFromUrl = searchParams.get('customerId');
    if (customerIdFromUrl && customers.some(c => c.id === customerIdFromUrl)) {
      setCustomerId(customerIdFromUrl);
    }
  }, [searchParams, customers]);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedService = services.find(s => s.id === serviceId);

  // Filter staff by service requirements
  const filteredStaff = useMemo(() => {
    if (!selectedService || !selectedService.staffHabilitadoIds || selectedService.staffHabilitadoIds.length === 0) {
      return allStaff;
    }
    return allStaff.filter(s => selectedService.staffHabilitadoIds!.includes(s.id));
  }, [selectedService, allStaff]);

  // Calcular horário de término
  const endTime = useMemo(() => {
    if (!selectedService || !startTime || typeof startTime !== 'string' || !startTime.includes(':')) return '';
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return '';
      const start = setMinutes(setHours(new Date(), hours), minutes);
      const totalMin = selectedService.duracaoMin + (selectedService.bufferAntesMin || 0) + (selectedService.bufferDepoisMin || 0);
      const end = addMinutes(start, totalMin);
      return format(end, 'HH:mm');
    } catch (error) {
      console.error('Erro ao calcular horário de término:', error);
      return '';
    }
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

    // Verificar se startTime é uma string válida antes de usar split
    if (typeof startTime !== 'string' || !startTime.includes(':')) {
      toast.error('Horário de início inválido');
      return;
    }

    try {
      const customer = customers.find(c => c.id === customerId)!;
      const service = services.find(s => s.id === serviceId)!;

      const [hours, minutes] = startTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        toast.error('Horário de início inválido');
        return;
      }

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
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const lower = customerSearch.toLowerCase();
    return customers.filter(
      c =>
        c.nome.toLowerCase().includes(lower) ||
        c.telefone?.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower) ||
        c.documento?.toLowerCase().includes(lower)
    );
  }, [customers, customerSearch]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return services;
    const lower = serviceSearch.toLowerCase();
    return services.filter(
      s =>
        s.nome.toLowerCase().includes(lower) ||
        s.categoria?.toLowerCase().includes(lower)
    );
  }, [services, serviceSearch]);

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
                <Label>
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOpen}
                      className="w-full justify-between"
                    >
                      {customerId
                        ? customers.find(c => c.id === customerId)?.nome
                        : 'Selecione o cliente...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar cliente..."
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                              Nenhum cliente encontrado
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCustomerOpen(false);
                                navigate('/erp/agenda/clientes/novo');
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Novo Cliente
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers.map(customer => (
                            <CommandItem
                              key={customer.id}
                              value={customer.id}
                              onSelect={() => {
                                setCustomerId(customer.id);
                                setCustomerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  customerId === customer.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{customer.nome}</span>
                                {customer.telefone && (
                                  <span className="text-xs text-muted-foreground">
                                    {customer.telefone}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
              <Label>
                Serviço <span className="text-destructive">*</span>
              </Label>
              <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceOpen}
                    className="w-full justify-between"
                  >
                    {serviceId
                      ? services.find(s => s.id === serviceId)?.nome
                      : 'Selecione o serviço...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar serviço..."
                      value={serviceSearch}
                      onValueChange={setServiceSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            Nenhum serviço encontrado
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setServiceOpen(false);
                              navigate('/erp/agenda/servicos/novo');
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Serviço
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredServices.map(service => (
                          <CommandItem
                            key={service.id}
                            value={service.id}
                            onSelect={() => {
                              setServiceId(service.id);
                              setServiceOpen(false);
                              // Clear staff selection when service changes
                              setStaffIds([]);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                serviceId === service.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2">
                                {service.cor && (
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: service.cor }}
                                  />
                                )}
                                <span>{service.nome}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {service.duracaoMin}min - R$ {service.precoBase.toFixed(2)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedService && (
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary">
                  Duração: {selectedService.duracaoMin} min
                </Badge>
                <Badge variant="secondary">
                  Preço: R$ {selectedService.precoBase.toFixed(2)}
                </Badge>
                {(selectedService.bufferAntesMin || selectedService.bufferDepoisMin) && (
                  <Badge variant="outline">
                    Buffers: {selectedService.bufferAntesMin || 0}min antes / {selectedService.bufferDepoisMin || 0}min depois
                  </Badge>
                )}
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
              {selectedService?.staffHabilitadoIds && selectedService.staffHabilitadoIds.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Filtrado por serviço
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum profissional disponível para este serviço
                </p>
              ) : (
                filteredStaff.map((s) => (
                  <Badge
                    key={s.id}
                    variant={staffIds.includes(s.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleStaffToggle(s.id)}
                  >
                    {s.nome}
                  </Badge>
                ))
              )}
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
                <Label>Término (estimado)</Label>
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
