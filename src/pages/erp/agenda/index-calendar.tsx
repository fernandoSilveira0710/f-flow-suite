import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isToday, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Search } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAppointments, getServices, getStaff, type Appointment } from '@/lib/schedule-api';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month' | 'list';

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
  CHECKIN: 'Check-in',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  NO_SHOW: 'Não Compareceu',
};

export default function AgendaIndex() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'week');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedStaff, setSelectedStaff] = useState<string>(searchParams.get('staffId') || 'all');
  const [selectedService, setSelectedService] = useState<string>(searchParams.get('serviceId') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const appointments = getAppointments();
  const services = getServices();
  const staff = getStaff();

  // Filtrar appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchSearch = !search || 
        apt.customerNome.toLowerCase().includes(search.toLowerCase()) ||
        apt.serviceNome.toLowerCase().includes(search.toLowerCase());
      
      const matchStaff = selectedStaff === 'all' || apt.staffIds.includes(selectedStaff);
      const matchService = selectedService === 'all' || apt.serviceId === selectedService;
      const matchStatus = selectedStatus === 'all' || apt.status === selectedStatus;

      return matchSearch && matchStaff && matchService && matchStatus;
    });
  }, [appointments, search, selectedStaff, selectedService, selectedStatus]);

  // Navegação de datas
  const handlePrevious = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  // Renderizar visualizações
  const renderDayView = () => {
    const dayAppointments = filteredAppointments.filter((apt) =>
      isSameDay(parseISO(apt.startISO), currentDate)
    ).sort((a, b) => a.startISO.localeCompare(b.startISO));

    return (
      <div className="space-y-2">
        {dayAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum agendamento para este dia
          </div>
        ) : (
          dayAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/erp/agenda/${apt.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('w-2 h-2 rounded-full', statusColors[apt.status])} />
                    <span className="font-medium">{format(parseISO(apt.startISO), 'HH:mm', { locale: ptBR })}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-medium">{format(parseISO(apt.endISO), 'HH:mm', { locale: ptBR })}</span>
                  </div>
                  <div className="font-semibold">{apt.customerNome}</div>
                  <div className="text-sm text-muted-foreground">{apt.serviceNome}</div>
                  {apt.customerContato && (
                    <div className="text-xs text-muted-foreground mt-1">{apt.customerContato}</div>
                  )}
                </div>
                <Badge variant="secondary">{statusLabels[apt.status]}</Badge>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayAppointments = filteredAppointments.filter((apt) =>
            isSameDay(parseISO(apt.startISO), day)
          ).sort((a, b) => a.startISO.localeCompare(b.startISO));

          return (
            <div key={day.toISOString()} className="border rounded-lg p-2 min-h-[200px]">
              <div className={cn(
                'text-center font-medium mb-2 pb-2 border-b',
                isToday(day) && 'text-primary'
              )}>
                <div className="text-xs">{format(day, 'EEE', { locale: ptBR })}</div>
                <div className="text-lg">{format(day, 'd', { locale: ptBR })}</div>
              </div>
              <div className="space-y-1">
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="text-xs p-2 rounded bg-muted hover:bg-muted/80 cursor-pointer"
                    onClick={() => navigate(`/erp/agenda/${apt.id}`)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className={cn('w-1.5 h-1.5 rounded-full', statusColors[apt.status])} />
                      <span className="font-medium">{format(parseISO(apt.startISO), 'HH:mm')}</span>
                    </div>
                    <div className="font-medium truncate">{apt.customerNome}</div>
                    <div className="text-muted-foreground truncate">{apt.serviceNome}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayAppointments = filteredAppointments.filter((apt) =>
            isSameDay(parseISO(apt.startISO), day)
          );
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'border rounded-lg p-2 min-h-[100px]',
                !isCurrentMonth && 'opacity-30',
                isToday(day) && 'ring-2 ring-primary'
              )}
            >
              <div className={cn('text-sm mb-1', isToday(day) && 'font-bold text-primary')}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="text-xs p-1 rounded bg-muted hover:bg-muted/80 cursor-pointer truncate"
                    onClick={() => navigate(`/erp/agenda/${apt.id}`)}
                  >
                    <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1', statusColors[apt.status])} />
                    {apt.customerNome}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const sortedAppointments = [...filteredAppointments].sort((a, b) => 
      a.startISO.localeCompare(b.startISO)
    );

    return (
      <div className="space-y-2">
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum agendamento encontrado
          </div>
        ) : (
          sortedAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/erp/agenda/${apt.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('w-2 h-2 rounded-full', statusColors[apt.status])} />
                    <span className="font-medium">
                      {format(parseISO(apt.startISO), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="font-semibold">{apt.customerNome}</div>
                  <div className="text-sm text-muted-foreground">{apt.serviceNome}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Profissional(is): {apt.staffIds.map(id => staff.find(s => s.id === id)?.nome).filter(Boolean).join(', ')}
                  </div>
                </div>
                <Badge variant="secondary">{statusLabels[apt.status]}</Badge>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const dateRangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: ptBR });
      const weekEnd = endOfWeek(currentDate, { locale: ptBR });
      return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`;
    } else if (viewMode === 'month') {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
    return 'Todos';
  }, [currentDate, viewMode]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gerencie os agendamentos de serviços"
        actionLabel="Novo Agendamento"
        actionIcon={Plus}
        onAction={() => navigate('/erp/agenda/novo')}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente ou serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">Todos</SelectItem>
            {staff.filter(s => s.ativo).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">Todos</SelectItem>
            {services.filter(s => s.ativo).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navegação e Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-4 font-medium">{dateRangeLabel}</span>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo */}
      <div className="rounded-2xl border bg-card p-6">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'list' && renderListView()}
      </div>
    </div>
  );
}
