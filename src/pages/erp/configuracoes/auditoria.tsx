import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAuditEvents, AuditEvent } from '@/lib/settings-api';

export default function AuditoriaPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAuditEvents().then(setEvents);
  }, []);

  const filteredEvents = events.filter(e =>
    e.tipo.toLowerCase().includes(search.toLowerCase()) ||
    e.usuario.toLowerCase().includes(search.toLowerCase())
  );

  const getTipoColor = (tipo: string) => {
    if (tipo.includes('created')) return 'default';
    if (tipo.includes('updated')) return 'secondary';
    if (tipo.includes('deleted')) return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoria</h1>
        <p className="text-muted-foreground mt-1">Registro de ações realizadas no sistema</p>
      </div>

      <Input
        placeholder="Buscar por tipo ou usuário..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  {new Date(event.data).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Badge variant={getTipoColor(event.tipo)}>
                    {event.tipo}
                  </Badge>
                </TableCell>
                <TableCell>{event.usuario}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {event.payload.substring(0, 50)}...
                  </code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
