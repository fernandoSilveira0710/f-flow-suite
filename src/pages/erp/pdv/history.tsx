import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSales, Sale } from '@/lib/pos-api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const data = await getSales();
    setSales(data);
  };

  const filteredSales = sales.filter(sale =>
    sale.id.toLowerCase().includes(search.toLowerCase()) ||
    sale.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrintReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setShowReceipt(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/pdv')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Histórico de Vendas</h1>
          <p className="text-muted-foreground">Consulte vendas realizadas</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar por ID ou forma de pagamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  <div className="flex flex-col items-center py-8">
                    <History className="h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhuma venda encontrada</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-sm">{sale.id}</TableCell>
                  <TableCell>
                    {new Date(sale.createdAt).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{sale.operator}</TableCell>
                  <TableCell>{sale.items?.length || 0}</TableCell>
                  <TableCell className="font-semibold">
                    R$ {sale.total.toFixed(2)}
                  </TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'destructive'} className={sale.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintReceipt(sale)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recibo de Venda</DialogTitle>
            <DialogDescription>Venda {selectedSale?.id}</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">2F Solutions</h3>
                <p className="text-sm text-muted-foreground">PDV - Recibo de Venda</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Venda:</span>
                  <span className="font-mono">{selectedSale.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span>{new Date(selectedSale.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operador:</span>
                  <span>{selectedSale.operator}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Itens</h4>
                <div className="space-y-1 text-sm">
                  {selectedSale.items?.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {item.qty}x {item.productName ?? `Produto ID: ${item.productId}`}
                      </span>
                      <span>R$ {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {selectedSale.total.toFixed(2)}</span>
                </div>
                {/* Removendo desconto pois não está sendo usado */}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {selectedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pagamento:</span>
                  <span>{selectedSale.paymentMethod}</span>
                </div>
              </div>

              <Button className="w-full" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
