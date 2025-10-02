import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Printer, Calendar, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { format, isToday, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  getGroomTickets,
  getGroomServices,
  getPets,
  getTutors,
  getGroomResources,
  getGroomPrefs,
  updateGroomTicket,
  type GroomTicket,
  type TicketStatus,
  type Porte,
} from '@/lib/grooming-api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const COLUMNS: { status: TicketStatus; label: string; color: string }[] = [
  { status: 'CHECKIN', label: 'Check-in', color: 'bg-blue-500' },
  { status: 'BANHO', label: 'Banho', color: 'bg-cyan-500' },
  { status: 'SECAGEM', label: 'Secagem', color: 'bg-orange-500' },
  { status: 'TOSA', label: 'Tosa', color: 'bg-purple-500' },
  { status: 'FINALIZACAO', label: 'Finalização', color: 'bg-indigo-500' },
  { status: 'PRONTO', label: 'Pronto', color: 'bg-green-500' },
  { status: 'ENTREGUE', label: 'Entregue', color: 'bg-gray-500' },
];

export default function GroomingIndex() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<GroomTicket[]>(getGroomTickets());
  const services = getGroomServices();
  const pets = getPets();
  const tutors = getTutors();
  const resources = getGroomResources();
  const prefs = getGroomPrefs();

  const { filters, setFilters, clearFilters, activeFiltersCount } = useUrlFilters({
    q: '',
    periodo: 'hoje' as 'hoje' | '7d' | 'custom',
    status: [] as TicketStatus[],
    servico: [] as string[],
    porte: [] as Porte[],
  });

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (filters.periodo) {
      case '7d':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case 'hoje':
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [filters.periodo]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Date filter
    result = result.filter((t) => {
      const ticketDate = parseISO(t.dataAberturaISO);
      return ticketDate >= dateRange.start && ticketDate <= dateRange.end;
    });

    // Text search
    if (filters.q) {
      const lower = filters.q.toLowerCase();
      result = result.filter(
        (t) =>
          t.codigo.toLowerCase().includes(lower) ||
          t.petNome.toLowerCase().includes(lower) ||
          t.tutorNome.toLowerCase().includes(lower)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter((t) => filters.status.includes(t.status));
    }

    // Service filter
    if (filters.servico.length > 0) {
      result = result.filter((t) =>
        t.itens.some((item) => filters.servico.includes(item.serviceId))
      );
    }

    // Porte filter
    if (filters.porte.length > 0) {
      result = result.filter((t) =>
        t.itens.some((item) => filters.porte.includes(item.porte))
      );
    }

    return result;
  }, [tickets, filters, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const todayTickets = tickets.filter((t) => isToday(parseISO(t.dataAberturaISO)));
    const inProgress = todayTickets.filter(
      (t) => !['ENTREGUE', 'CANCELADO'].includes(t.status)
    );
    const ready = todayTickets.filter((t) => t.status === 'PRONTO');
    const receita = todayTickets.reduce(
      (sum, t) => sum + t.itens.reduce((s, i) => s + i.preco * i.qtd, 0),
      0
    );
    return {
      total: todayTickets.length,
      emAndamento: inProgress.length,
      prontos: ready.length,
      receita,
    };
  }, [tickets]);

  // Group by status
  const ticketsByStatus = useMemo(() => {
    const groups: Record<TicketStatus, GroomTicket[]> = {
      CHECKIN: [],
      BANHO: [],
      SECAGEM: [],
      TOSA: [],
      FINALIZACAO: [],
      PRONTO: [],
      ENTREGUE: [],
      CANCELADO: [],
    };
    filteredTickets.forEach((t) => {
      if (groups[t.status]) {
        groups[t.status].push(t);
      }
    });
    return groups;
  }, [filteredTickets]);

  // Check if has basic data
  const hasServices = services.length > 0;
  const hasPets = pets.length > 0;
  const hasTutors = tutors.length > 0;
  const hasResources = resources.length > 0;
  const canCheckIn = hasServices && hasPets && hasTutors;

  // Move ticket to next status
  const handleMoveToNext = (ticketId: string, currentStatus: TicketStatus) => {
    const statusOrder: TicketStatus[] = [
      'CHECKIN',
      'BANHO',
      'SECAGEM',
      'TOSA',
      'FINALIZACAO',
      'PRONTO',
      'ENTREGUE',
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return;

    const nextStatus = statusOrder[currentIndex + 1];
    updateGroomTicket(ticketId, { status: nextStatus });
    setTickets(getGroomTickets());
    toast.success(`Movido para ${COLUMNS.find((c) => c.status === nextStatus)?.label}`);
  };

  // Hotkeys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;

      switch (e.key.toLowerCase()) {
        case 'n':
          if (canCheckIn) navigate('/erp/grooming/new');
          break;
        case 'f':
          document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, canCheckIn]);

  // Empty state
  if (tickets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Banho & Tosa</h1>
            <p className="text-muted-foreground mt-1">
              Sistema operacional de pet shop
            </p>
          </div>
        </div>

        <Card className="p-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Nenhum atendimento hoje</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {!canCheckIn
                  ? 'Complete o cadastro básico antes de fazer check-ins'
                  : 'Comece criando seu primeiro atendimento'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {!hasServices && (
                <Card className="p-4 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => navigate('/erp/grooming/services/novo')}
                >
                  <Plus className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Cadastrar Serviço</p>
                </Card>
              )}
              {!hasTutors && (
                <Card className="p-4 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => navigate('/erp/grooming/tutors/novo')}
                >
                  <Plus className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Cadastrar Tutor</p>
                </Card>
              )}
              {!hasPets && (
                <Card className="p-4 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => navigate('/erp/grooming/pets/novo')}
                >
                  <Plus className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Cadastrar Pet</p>
                </Card>
              )}
              {!hasResources && (
                <Card className="p-4 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => navigate('/erp/grooming/resources/novo')}
                >
                  <Plus className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Cadastrar Recurso</p>
                </Card>
              )}
              {canCheckIn && (
                <Card className="p-4 text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                  onClick={() => navigate('/erp/grooming/new')}
                >
                  <Plus className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Fazer Check-in</p>
                </Card>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banho & Tosa</h1>
          <p className="text-muted-foreground mt-1">
            {format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={() => navigate('/erp/grooming/new')}
            disabled={!canCheckIn}
          >
            <Plus className="h-4 w-4 mr-2" />
            Check-in <kbd className="ml-2 px-1.5 py-0.5 text-xs border rounded bg-muted">N</kbd>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpis.emAndamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prontos p/ Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.prontos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Estimada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por pet, tutor ou código... (F)"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.periodo}
            onValueChange={(value: any) => setFilters({ periodo: value })}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar ({activeFiltersCount})
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnTickets = ticketsByStatus[column.status] || [];
          return (
            <div key={column.status} className="flex-shrink-0 w-80">
              <div className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', column.color)} />
                    <span className="font-semibold">{column.label}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {columnTickets.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {columnTickets.length === 0 ? (
                    <Card className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum ticket
                    </Card>
                  ) : (
                    columnTickets.map((ticket) => {
                      const pet = pets.find((p) => p.id === ticket.petId);
                      const tutor = tutors.find((t) => t.id === ticket.tutorId);

                      return (
                        <Card
                          key={ticket.id}
                          className="p-4 space-y-3 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => navigate(`/erp/grooming/${ticket.id}`)}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold">{ticket.petNome}</div>
                              <div className="text-sm text-muted-foreground">
                                {ticket.tutorNome}
                              </div>
                            </div>
                            {pet && (
                              <Badge variant="outline" className="text-xs">
                                {pet.porte}
                              </Badge>
                            )}
                          </div>

                          {/* Services */}
                          <div className="flex flex-wrap gap-1">
                            {ticket.itens.map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {item.nome}
                              </Badge>
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{ticket.codigo}</span>
                            {ticket.sinalRecebido && (
                              <Badge variant="outline" className="text-xs">
                                <DollarSign className="h-3 w-3 mr-1" />
                                Sinal
                              </Badge>
                            )}
                          </div>

                          {/* Quick Actions */}
                          {column.status !== 'ENTREGUE' && column.status !== 'CANCELADO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveToNext(ticket.id, ticket.status);
                              }}
                            >
                              Próxima Etapa →
                            </Button>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
