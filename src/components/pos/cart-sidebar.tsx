import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/lib/pos-api';
import { cn } from '@/lib/utils';

interface CartSidebarProps {
  cart: CartItem[];
  onUpdateQtd: (itemId: string, qtd: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  discount: number;
  className?: string;
}

export function CartSidebar({
  cart,
  onUpdateQtd,
  onRemoveItem,
  onCheckout,
  discount,
  className,
}: CartSidebarProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - discount;

  return (
    <div className={cn('flex flex-col h-full border-l bg-card', className)}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-semibold">Carrinho</h2>
          <span className="ml-auto text-sm text-muted-foreground">
            {cart.length} {cart.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
            <p>Carrinho vazio</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.produto.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.produto.sku}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQtd(item.id, item.qtd - 1)}
                      disabled={item.qtd <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">{item.qtd}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQtd(item.id, item.qtd + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {item.qtd}x R$ {item.produto.preco.toFixed(2)}
                    </p>
                    <p className="font-semibold">R$ {item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-secondary">
              <span>Desconto</span>
              <span>- R$ {discount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={cart.length === 0}
        >
          Finalizar Venda
        </Button>
      </div>
    </div>
  );
}
