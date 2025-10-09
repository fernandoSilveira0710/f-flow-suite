import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Banknote, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getCart, createSale } from '@/lib/pos-api';

const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'debito', label: 'Cartão Débito', icon: CreditCard },
  { id: 'credito', label: 'Cartão Crédito', icon: CreditCard },
  { id: 'pix', label: 'PIX', icon: Smartphone },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const discount = location.state?.discount || 0;

  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [parcelas, setParcelas] = useState('1');
  const [loading, setLoading] = useState(false);

  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - discount;

  const handleConfirm = async () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    setLoading(true);
    try {
      const sale = await createSale(
        cart,
        paymentMethod === 'credito' ? `Crédito ${parcelas}x` : PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod,
        paymentMethod === 'credito' ? parseInt(parcelas) : undefined,
        discount
      );

      toast.success(`Venda ${sale.id} concluída com sucesso!`);
      navigate('/erp/pdv/history');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao finalizar venda');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">Carrinho vazio</p>
        <Button onClick={() => navigate('/erp/pdv')}>Voltar ao PDV</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp/pdv')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Finalizar Venda</h1>
          <p className="text-muted-foreground">Selecione a forma de pagamento</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Forma de Pagamento</CardTitle>
            <CardDescription>Escolha como o cliente irá pagar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="h-4 w-4" />
                      {method.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            {paymentMethod === 'credito' && (
              <div className="space-y-2 pt-4">
                <Label htmlFor="parcelas">Número de Parcelas</Label>
                <Select value={parcelas} onValueChange={setParcelas}>
                  <SelectTrigger id="parcelas">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de R$ {(total / num).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
            <CardDescription>{cart.length} itens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.produto.id} className="flex justify-between text-sm">
                  <span>
                    {item.qtd}x {item.produto.nome}
                  </span>
                  <span>R$ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Desconto</span>
                  <span>- R$ {discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/erp/pdv')}>
          Cancelar
        </Button>
        <Button size="lg" onClick={handleConfirm} disabled={loading}>
          Confirmar Pagamento
        </Button>
      </div>
    </div>
  );
}
