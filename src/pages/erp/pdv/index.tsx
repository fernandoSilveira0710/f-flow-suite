import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, DoorOpen, DoorClosed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CartSidebar } from '@/components/pos/cart-sidebar';
import { ProductGrid } from '@/components/pos/product-grid';
import {
  getSession,
  closeSession,
  getProducts,
  searchProducts,
  addToCart,
  updateCartItem,
  removeFromCart,
  getCart,
  applyDiscount,
  Product,
  CartItem,
  Session,
} from '@/lib/pos-api';

export default function PdvPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    loadSession();
    loadProducts();
    loadCart();
  }, []);

  const loadSession = () => {
    const currentSession = getSession();
    setSession(currentSession);
  };

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const loadCart = () => {
    const currentCart = getCart();
    setCart(currentCart);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const results = await searchProducts(query);
    setProducts(results);
  };

  const handleAddToCart = async (productId: string) => {
    if (!session || session.status !== 'Aberto') {
      toast.error('Abra uma sessão de caixa primeiro');
      return;
    }

    try {
      const updatedCart = await addToCart(productId);
      setCart(updatedCart);
      toast.success('Item adicionado ao carrinho');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar item');
    }
  };

  const handleUpdateQtd = async (productId: string, qtd: number) => {
    try {
      const updatedCart = await updateCartItem(productId, qtd);
      setCart(updatedCart);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar quantidade');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const updatedCart = await removeFromCart(productId);
      setCart(updatedCart);
      toast.success('Item removido');
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const handleApplyCoupon = () => {
    const discountAmount = applyDiscount(cart, couponCode);
    if (discountAmount > 0) {
      setDiscount(discountAmount);
      toast.success('Cupom aplicado com sucesso!');
    } else {
      setDiscount(0);
      toast.error('Cupom inválido');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    navigate('/erp/pdv/checkout', { state: { discount } });
  };

  const handleOpenSession = () => {
    navigate('/erp/pdv/session');
  };

  const handleCloseSession = async () => {
    try {
      await closeSession();
      toast.success('Caixa fechado com sucesso');
      setShowCloseDialog(false);
      loadSession();
      navigate('/erp/pdv/history');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fechar caixa');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Ponto de Venda</h1>
              <p className="text-sm text-muted-foreground">
                Operador: {session?.operador || 'Não logado'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {session?.status === 'Aberto' ? (
                <>
                  <Badge variant="default" className="gap-2">
                    <DoorOpen className="h-3 w-3" />
                    Caixa Aberto
                  </Badge>
                  <Button variant="outline" onClick={() => setShowCloseDialog(true)}>
                    Fechar Caixa
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="gap-2">
                    <DoorClosed className="h-3 w-3" />
                    Caixa Fechado
                  </Badge>
                  <Button onClick={handleOpenSession}>Abrir Caixa</Button>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome ou SKU..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Cupom de desconto"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" onClick={handleApplyCoupon}>
              Aplicar
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-4">
          <ProductGrid products={products} onAddToCart={handleAddToCart} />
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        cart={cart}
        onUpdateQtd={handleUpdateQtd}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        discount={discount}
        className="w-96"
      />

      {/* Close Session Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja fechar o caixa?
              {session && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Vendas:</span>
                    <span className="font-semibold">{session.vendas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-semibold">R$ {session.totalVendas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saldo Inicial:</span>
                    <span className="font-semibold">R$ {session.saldoInicial.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseSession}>
              Confirmar Fechamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
