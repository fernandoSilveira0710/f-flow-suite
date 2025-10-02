import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Printer, Calendar, DollarSign, ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { format, isToday, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type Density = 'comfort' | 'default' | 'compact';
type Cluster = 'all' | 'entrada' | 'processo' | 'saida';

const COLUMNS: { status: TicketStatus; label: string; color: string; cluster: Cluster }[] = [
  { status: 'CHECKIN', label: 'Check-in', color: 'bg-blue-500', cluster: 'entrada' },
  { status: 'BANHO', label: 'Banho', color: 'bg-cyan-500', cluster: 'processo' },
  { status: 'SECAGEM', label: 'Secagem', color: 'bg-orange-500', cluster: 'processo' },
  { status: 'TOSA', label: 'Tosa', color: 'bg-purple-500', cluster: 'processo' },
  { status: 'FINALIZACAO', label: 'Finalização', color: 'bg-indigo-500', cluster: 'processo' },
  { status: 'PRONTO', label: 'Pronto', color: 'bg-green-500', cluster: 'saida' },
  { status: 'ENTREGUE', label: 'Entregue', color: 'bg-gray-500', cluster: 'saida' },
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
    cluster: 'all' as Cluster,
    collapsed: [] as TicketStatus[],
    density: 'default' as Density,
  });

  const [collapsedColumns, setCollapsedColumns] = useState<Set<TicketStatus>>(
    new Set(filters.collapsed)
  );

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

  // Filter columns by cluster
  const visibleColumns = useMemo(() => {
    if (filters.cluster === 'all') return COLUMNS;
    return COLUMNS.filter((col) => col.cluster === filters.cluster);
  }, [filters.cluster]);

  // Toggle column collapse
  const toggleCollapse = (status: TicketStatus) => {
    const newCollapsed = new Set(collapsedColumns);
    if (newCollapsed.has(status)) {
      newCollapsed.delete(status);
    } else {
      newCollapsed.add(status);
    }
    setCollapsedColumns(newCollapsed);
    setFilters({ collapsed: Array.from(newCollapsed) });
  };

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

  const densityClasses = {
    comfort: { card: 'p-4 space-y-3', text: 'text-base', icon: 'h-5 w-5' },
    default: { card: 'p-3 space-y-2', text: 'text-sm', icon: 'h-4 w-4' },
    compact: { card: 'p-2 space-y-1.5', text: 'text-xs', icon: 'h-4 w-4' },
  };

  const density = densityClasses[filters.density];

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 space-y-4">
          {/* Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Banho & Tosa</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ 
                  density: filters.density === 'compact' ? 'default' : 'compact' 
                })}
              >
                {filters.density === 'compact' ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Imprimir</span>
              </Button>
              <Button
                onClick={() => navigate('/erp/grooming/new')}
                disabled={!canCheckIn}
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Check-in</span>
                <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 text-xs border rounded bg-muted">N</kbd>
              </Button>
            </div>
          </div>

          {/* KPIs - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-0 shadow-none bg-muted/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Total Hoje</div>
                <div className="text-xl font-bold">{kpis.total}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-muted/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Em Andamento</div>
                <div className="text-xl font-bold text-blue-600">{kpis.emAndamento}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-muted/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Prontos</div>
                <div className="text-xl font-bold text-green-600">{kpis.prontos}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-muted/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Receita Est.</div>
                <div className="text-xl font-bold">
                  {kpis.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cluster Tabs + Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <Tabs
              value={filters.cluster}
              onValueChange={(value) => setFilters({ cluster: value as Cluster })}
              className="flex-shrink-0"
            >
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="entrada">Entrada</TabsTrigger>
                <TabsTrigger value="processo">Processo</TabsTrigger>
                <TabsTrigger value="saida">Saída</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1 flex gap-2">
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleColumns.map((column) => {
            const columnTickets = ticketsByStatus[column.status] || [];
            const isCollapsed = collapsedColumns.has(column.status);

            return (
              <section key={column.status} className="min-w-0">
                {/* Column Header */}
                <div 
                  className="flex items-center justify-between p-2.5 rounded-lg bg-card border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCollapse(column.status)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    )}
                    <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', column.color)} />
                    <span className="font-semibold text-sm truncate">{column.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnTickets.length}
                  </Badge>
                </div>

                {/* Cards */}
                {!isCollapsed && (
                  <div className="mt-2 space-y-2 overflow-auto max-h-[calc(100vh-320px)]">
                    {columnTickets.length === 0 ? (
                      <Card className="p-3 text-center text-xs text-muted-foreground">
                        Nenhum ticket
                      </Card>
                    ) : (
                        columnTickets.map((ticket) => {
                          const pet = pets.find((p) => p.id === ticket.petId);
                          const tutor = tutors.find((t) => t.id === ticket.tutorId);

                          return (
                            <Card
                              key={ticket.id}
                              className={cn(
                                density.card,
                                'cursor-pointer hover:border-primary transition-colors'
                              )}
                              onClick={() => navigate(`/erp/grooming/${ticket.id}`)}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className={cn('font-semibold truncate', density.text)}>
                                    {ticket.petNome}
                                  </div>
                                  {filters.density !== 'compact' && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {ticket.tutorNome}
                                    </div>
                                  )}
                                </div>
                                {pet && (
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {pet.porte}
                                  </Badge>
                                )}
                              </div>

                              {/* Services */}
                              <div className="flex flex-wrap gap-1">
                                {ticket.itens.slice(0, filters.density === 'compact' ? 2 : 3).map((item, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {item.nome}
                                  </Badge>
                                ))}
                                {ticket.itens.length > (filters.density === 'compact' ? 2 : 3) && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{ticket.itens.length - (filters.density === 'compact' ? 2 : 3)}
                                  </Badge>
                                )}
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="truncate">{ticket.codigo}</span>
                                {ticket.sinalRecebido && (
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    <DollarSign className="h-3 w-3" />
                                  </Badge>
                                )}
                              </div>

                              {/* Quick Actions */}
                              {column.status !== 'ENTREGUE' && column.status !== 'CANCELADO' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs"
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
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
