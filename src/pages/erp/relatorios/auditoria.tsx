import { useEffect, useMemo, useState } from 'react';
import { getAuditEvents, AuditEvent } from '@/lib/settings-api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function RelatoriosAuditoriaPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await getAuditEvents();
      setEvents(data);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return events;
    return events.filter(e =>
      e.tipo.toLowerCase().includes(q) ||
      e.usuario.toLowerCase().includes(q) ||
      (e.payload || '').toLowerCase().includes(q)
    );
  }, [events, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Auditoria de operações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
          <CardDescription>
            Lista de eventos de criação, atualização e deleção realizados por usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filtrar por tipo, usuário ou payload..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum evento encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(evt => (
                  <TableRow key={evt.id}>
                    <TableCell>{new Date(evt.data).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{evt.tipo}</Badge>
                    </TableCell>
                    <TableCell>{evt.usuario}</TableCell>
                    <TableCell>
                      <pre className="whitespace-pre-wrap text-xs max-w-[600px] overflow-hidden">
                        {evt.payload}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
