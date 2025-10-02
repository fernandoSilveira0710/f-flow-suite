import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  getTutors,
  getPets,
  getGroomServices,
  getGroomResources,
  createGroomTicket,
  type Porte,
} from '@/lib/grooming-api';
import { toast } from 'sonner';

const porteLabels = { PP: 'Mini', P: 'Pequeno', M: 'Médio', G: 'Grande', GG: 'Gigante' };
const categoryLabels = {
  BANHO: 'Banho',
  TOSA: 'Tosa',
  HIGIENE: 'Higiene',
  HIDRATACAO: 'Hidratação',
  COMBO: 'Combo',
  OUTROS: 'Outros',
};

export default function GroomingCheckIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [tutorId, setTutorId] = useState('');
  const [petId, setPetId] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [professionalId, setProfessionalId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(minutes, 0, 0);
    return now.toTimeString().slice(0, 5);
  });
  const [endTime, setEndTime] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [nsu, setNsu] = useState('');
  const [includePhotos, setIncludePhotos] = useState(false);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');

  // Data
  const tutors = getTutors().filter((t) => t.ativo);
  const allPets = getPets().filter((p) => p.ativo);
  const services = getGroomServices().filter((s) => s.ativo);
  const resources = getGroomResources().filter((r) => r.ativo);

  // Mock payment methods
  const paymentMethods = [
    { id: '1', nome: 'Dinheiro', exigeAutorizacao: false },
    { id: '2', nome: 'PIX', exigeAutorizacao: false },
    { id: '3', nome: 'Débito', exigeAutorizacao: true },
    { id: '4', nome: 'Crédito', exigeAutorizacao: true },
  ];

  // Filter pets by selected tutor
  const availablePets = useMemo(() => {
    if (!tutorId) return allPets;
    return allPets.filter((p) => p.tutorId === tutorId);
  }, [tutorId, allPets]);

  // Get selected pet details
  const selectedPet = allPets.find((p) => p.id === petId);
  const selectedTutor = tutors.find((t) => t.id === tutorId);

  // Check if Tosa service is selected
  const hasTosaService = useMemo(() => {
    return selectedServices.some((sId) => {
      const service = services.find((s) => s.id === sId);
      return service?.categoria === 'TOSA';
    });
  }, [selectedServices, services]);

  // Calculate total duration and price
  const { totalMinutes, subtotal } = useMemo(() => {
    if (!selectedPet) return { totalMinutes: 0, subtotal: 0 };

    let mins = 0;
    let price = 0;

    selectedServices.forEach((sId) => {
      const service = services.find((s) => s.id === sId);
      if (service) {
        mins += service.duracaoBaseMin;
        price += service.precoPorPorte[selectedPet.porte] || 0;
      }
    });

    return { totalMinutes: mins, subtotal: price };
  }, [selectedServices, selectedPet, services]);

  const total = subtotal - discount;

  // Auto-calculate end time
  useEffect(() => {
    if (startTime && totalMinutes > 0) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + totalMinutes;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      setEndTime(`${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);
    }
  }, [startTime, totalMinutes]);

  // Pre-fill from query params
  useEffect(() => {
    const qTutor = searchParams.get('tutorId');
    const qPet = searchParams.get('petId');
    const qServices = searchParams.get('serviceIds');
    const qResource = searchParams.get('resourceId');

    if (qTutor) setTutorId(qTutor);
    if (qPet) setPetId(qPet);
    if (qServices) setSelectedServices(qServices.split(','));
    if (qResource) setResourceId(qResource);
  }, [searchParams]);

  // Update phone when tutor changes
  useEffect(() => {
    if (selectedTutor) {
      setPhone(selectedTutor.telefone || '');
    }
  }, [selectedTutor]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSubmit = (printLabel = false) => {
    // Validation
    if (!tutorId) {
      toast.error('Selecione um tutor');
      return;
    }
    if (!petId) {
      toast.error('Selecione um pet');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Selecione pelo menos um serviço');
      return;
    }
    if (hasTosaService && !resourceId) {
      toast.error('Recurso obrigatório para serviços de Tosa');
      return;
    }
    if (deposit > 0 && !paymentMethodId) {
      toast.error('Selecione um método de pagamento');
      return;
    }

    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);
    if (selectedMethod?.exigeAutorizacao && !nsu) {
      toast.error('Informe o NSU/Autorização');
      return;
    }

    const startISO = `${startDate}T${startTime}:00`;

    // Build itens array
    const itens = selectedServices.map((sId) => {
      const service = services.find((s) => s.id === sId);
      if (!service || !selectedPet) return null;
      return {
        serviceId: service.id,
        nome: service.nome,
        porte: selectedPet.porte as Porte,
        preco: service.precoPorPorte[selectedPet.porte],
        qtd: 1,
      };
    }).filter(Boolean) as Array<{ serviceId: string; nome: string; porte: Porte; preco: number; qtd: number }>;

    const ticket = createGroomTicket({
      dataAberturaISO: startISO,
      origem: 'WALKIN' as const,
      tutorId,
      tutorNome: selectedTutor?.nome || '',
      petId,
      petNome: selectedPet?.nome || '',
      itens,
      status: 'CHECKIN' as const,
      observacoes: notes || undefined,
      fotosAntes: includePhotos ? [] : undefined,
      sinalRecebido: deposit > 0 ? deposit : undefined,
    });

    toast.success('Check-in realizado!');

    if (printLabel) {
      toast.info('Etiqueta enviada para impressão');
    }

    navigate(`/erp/grooming?highlight=${ticket.id}`);
  };

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/grooming')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Check-in Banho & Tosa</h1>
          <p className="text-muted-foreground">Registre a entrada do pet</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Tutor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente / Tutor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tutor *</Label>
                <div className="flex gap-2">
                  <Select value={tutorId} onValueChange={setTutorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tutor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tutors.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome} {t.telefone && `• ${t.telefone}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/erp/grooming/tutors/novo')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Telefone/WhatsApp</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pet *</Label>
                <div className="flex gap-2">
                  <Select value={petId} onValueChange={setPetId} disabled={!tutorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o pet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} • {p.especie} • {porteLabels[p.porte]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/erp/grooming/pets/novo')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedPet && (
                <div className="flex gap-2">
                  <Badge variant="secondary">{selectedPet.especie}</Badge>
                  <Badge variant="outline">{porteLabels[selectedPet.porte]}</Badge>
                  <Badge
                    variant={
                      selectedPet.temperamento === 'DOCIL'
                        ? 'default'
                        : selectedPet.temperamento === 'AGRESSIVO'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {selectedPet.temperamento}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Serviços *</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/erp/grooming/services/novo')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => {}}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {service.cor && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.cor }}
                        />
                      )}
                      <span className="font-medium">{service.nome}</span>
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[service.categoria]}
                      </Badge>
                    </div>
                    {selectedPet && (
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duracaoBaseMin}min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {service.precoPorPorte[selectedPet.porte]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Professional & Resource */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alocação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select value={professionalId} onValueChange={setProfessionalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar profissional (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prof-1">João Silva</SelectItem>
                    <SelectItem value="prof-2">Maria Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recurso {hasTosaService && '*'}</Label>
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar recurso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome} ({r.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data & Hora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hora Início</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hora Término (estimada)</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>

              {totalMinutes > 0 && (
                <Badge variant="outline" className="w-full justify-center py-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Estimativa: {totalMinutes} minutos
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preço e Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedServices.length > 0 && selectedPet && (
                <div className="space-y-2 text-sm">
                  {selectedServices.map((sId) => {
                    const service = services.find((s) => s.id === sId);
                    if (!service) return null;
                    return (
                      <div key={sId} className="flex justify-between">
                        <span>{service.nome}</span>
                        <span>R$ {service.precoPorPorte[selectedPet.porte]}</span>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Sinal/Entrada (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                />
              </div>

              {deposit > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Método de Pagamento *</Label>
                    <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar método..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMethod?.exigeAutorizacao && (
                    <div className="space-y-2">
                      <Label>NSU/Autorização *</Label>
                      <Input
                        placeholder="000000"
                        value={nsu}
                        onChange={(e) => setNsu(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total Estimado</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                * Valor final será confirmado no PDV
              </p>
            </CardContent>
          </Card>

          {/* Extras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Itens Extras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="photos">Incluir fotos</Label>
                <Switch id="photos" checked={includePhotos} onCheckedChange={setIncludePhotos} />
              </div>

              <div className="space-y-2">
                <Label>Observações do Cliente</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/erp/grooming')}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={() => handleSubmit(false)}>
              Salvar Check-in
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit(true)}>
              Salvar e Imprimir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
