import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, DollarSign } from 'lucide-react';
import { GroomingTabs } from '@/components/erp/grooming-tabs';
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
  getProfessionals,
  createGroomTicket,
  type Porte,
} from '@/lib/grooming-api';
import { createAppointment, getServices, getStaff } from '@/lib/schedule-api';
import { addHours } from 'date-fns';
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
  const professionals = getProfessionals().filter((p) => p.ativo);

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

  // Auto-fill phone when tutor is selected
  useEffect(() => {
    if (selectedTutor?.telefone) {
      setPhone(selectedTutor.telefone);
    } else {
      setPhone('');
    }
  }, [selectedTutor]);

  // Check if phone should be disabled (when auto-filled from tutor)
  const isPhoneDisabled = Boolean(selectedTutor?.telefone);

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
        price += service.precoPorPorte[selectedPet.porte];
      }
    });

    return { totalMinutes: mins, subtotal: price };
  }, [selectedServices, services, selectedPet]);

  // Calculate final total
  const total = useMemo(() => {
    const finalAmount = subtotal - discount;
    return Math.max(0, finalAmount);
  }, [subtotal, discount]);

  // Auto-calculate end time
  useEffect(() => {
    if (startTime && typeof startTime === 'string' && startTime.includes(':') && totalMinutes > 0) {
      try {
        const [hours, minutes] = startTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + totalMinutes;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          setEndTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
        }
      } catch (error) {
        console.error('Erro ao calcular horário de fim:', error);
      }
    }
  }, [startTime, totalMinutes]);

  const handleServiceToggle = (serviceId: string) => {
    console.log('Toggling service:', serviceId, 'Current selected:', selectedServices);
    setSelectedServices((prev) => {
      const newSelected = prev.includes(serviceId) 
        ? prev.filter((id) => id !== serviceId) 
        : [...prev, serviceId];
      console.log('New selected services:', newSelected);
      return newSelected;
    });
  };

  const handleSubmit = async (printLabel: boolean) => {
    if (!tutorId || !petId || selectedServices.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!startDate || !startTime) {
      toast.error('Preencha a data e horário de início');
      return;
    }

    if (hasTosaService && !resourceId) {
      toast.error('Selecione um recurso para serviços de tosa');
      return;
    }

    if (deposit > 0 && !paymentMethodId) {
      toast.error('Selecione o método de pagamento para o sinal');
      return;
    }

    if (deposit > 0 && paymentMethods.find((m) => m.id === paymentMethodId)?.exigeAutorizacao && !nsu) {
      toast.error('Informe o NSU/Autorização');
      return;
    }

    const items = selectedServices.map((sId) => {
      const service = services.find((s) => s.id === sId);
      const price = service?.precoPorPorte[selectedPet!.porte] || 0;
      return {
        serviceId: sId,
        name: service?.nome || '',
        price: price,
        qty: 1,
        subtotal: price,
      };
    });

    // Calculate total price from items
    const totalPrice = items.reduce((total, item) => total + item.subtotal, 0);

    const ticket = createGroomTicket({
      petId,
      tutorId,
      status: 'CHECKIN' as const,
      totalPrice,
      items,
      notes: notes || undefined,
    });

    // Create appointment in schedule automatically after ticket is created
    try {
      // Calculate end time if not provided
      let calculatedEndTime = endTime ? `${startDate}T${endTime}:00` : undefined;
      if (!calculatedEndTime) {
        const startDateTime = new Date(`${startDate}T${startTime}:00`);
        const endDateTime = addHours(startDateTime, 2);
        calculatedEndTime = `${startDate}T${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}:00`;
      }

      const appointmentData = {
        customerId: tutorId,
        customerName: selectedTutor?.nome || '',
        customerContact: selectedTutor?.telefone || '',
        petId: petId,
        serviceId: selectedServices[0] || 'grooming-service',
        serviceName: items.map(i => i.name).join(', '),
        professionalId: professionalId || 'default-professional',
        startTime: `${startDate}T${startTime}:00`,
        endTime: calculatedEndTime,
        status: 'CONFIRMED' as const,
        notes: notes ? `${notes} - Ticket: ${ticket.id}` : `Ticket de Grooming: ${ticket.id}`,
      };
      
      await createAppointment(appointmentData);
      toast.success('Check-in realizado e agendamento criado automaticamente!');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.success('Check-in realizado!');
      toast.warning('Não foi possível criar o agendamento automaticamente');
    }

    if (printLabel) {
      toast.info('Etiqueta enviada para impressão');
    }

    navigate(`/erp/grooming?highlight=${ticket.id}`);
  };

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);

  return (
    <div className="space-y-6 pb-12">
      <GroomingTabs />
      
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
                  disabled={isPhoneDisabled}
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
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    id={`service-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <label 
                    htmlFor={`service-${service.id}`}
                    className="flex-1 cursor-pointer"
                  >
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
                  </label>
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
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} {p.especialidades && p.especialidades.length > 0 && `• ${p.especialidades.join(', ')}`}
                      </SelectItem>
                    ))}
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

          {/* Preços por Porte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preços por Porte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="precoPP">PP</Label>
                  <Input
                    id="precoPP"
                    type="number"
                    step="0.01"
                    value={selectedServices.reduce((total, sId) => {
                      const service = services.find(s => s.id === sId);
                      return total + (service?.precoPorPorte.PP || 0);
                    }, 0).toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoP">P</Label>
                  <Input
                    id="precoP"
                    type="number"
                    step="0.01"
                    value={selectedServices.reduce((total, sId) => {
                      const service = services.find(s => s.id === sId);
                      return total + (service?.precoPorPorte.P || 0);
                    }, 0).toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoM">M</Label>
                  <Input
                    id="precoM"
                    type="number"
                    step="0.01"
                    value={selectedServices.reduce((total, sId) => {
                      const service = services.find(s => s.id === sId);
                      return total + (service?.precoPorPorte.M || 0);
                    }, 0).toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoG">G</Label>
                  <Input
                    id="precoG"
                    type="number"
                    step="0.01"
                    value={selectedServices.reduce((total, sId) => {
                      const service = services.find(s => s.id === sId);
                      return total + (service?.precoPorPorte.G || 0);
                    }, 0).toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoGG">GG</Label>
                  <Input
                    id="precoGG"
                    type="number"
                    step="0.01"
                    value={selectedServices.reduce((total, sId) => {
                      const service = services.find(s => s.id === sId);
                      return total + (service?.precoPorPorte.GG || 0);
                    }, 0).toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              
              {selectedPet && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      Preço para {selectedPet.nome} ({porteLabels[selectedPet.porte]}):
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
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
                <Label>Valor Total</Label>
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-lg font-semibold">R$ {subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor calculado automaticamente com base nos serviços selecionados
                </p>
              </div>

              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
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
                  step="0.01"
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
