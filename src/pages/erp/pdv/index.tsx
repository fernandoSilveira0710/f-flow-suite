import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search,
  Keyboard,
  ShoppingCart,
  Trash2,
  DollarSign,
  Ban,
  Plus,
  Minus,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getSession,
  findProductByBarcode,
  addToCart,
  updateCartItem,
  removeFromCart,
  getCart,
  applyDiscount,
  applyItemDiscount,
  searchProducts,
  getSales,
  refundSale,
  CartItem,
  Session,
  Sale,
  Product,
} from '@/lib/pos-api';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { cn } from '@/lib/utils';

export default function PdvPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [activeTab, setActiveTab] = useState<'vender' | 'historico' | 'fechamento'>('vender');
  
  // Dialogs
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDiscountItem, setShowDiscountItem] = useState(false);
  const [showDiscountGlobal, setShowDiscountGlobal] = useState(false);
  const [showCancelSale, setShowCancelSale] = useState(false);
  
  // Search
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Discount
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'value'>('percent');
  
  // History
  const [sales, setSales] = useState<Sale[]>([]);
  
  // Scanner
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [scannerFocused, setScannerFocused] = useState(true);
  const [beepEnabled, setBeepEnabled] = useState(true);

  useEffect(() => {
    loadSession();
    loadCart();
    loadSales();
  }, []);

  useEffect(() => {
    // Check scanner focus periodically
    const interval = setInterval(() => {
      setScannerFocused(document.activeElement === scannerInputRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSession = () => {
    const currentSession = getSession();
    setSession(currentSession);
  };

  const loadCart = () => {
    const currentCart = getCart();
    setCart(currentCart);
  };

  const loadSales = async () => {
    const allSales = await getSales();
    setSales(allSales);
  };

  const playBeep = () => {
    if (!beepEnabled) return;
    const audio = new Audio('data:audio/wav;base64,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');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const handleScan = async (code: string) => {
    try {
      const product = await findProductByBarcode(code);
      if (product) {
        const updatedCart = await addToCart(product.id);
        setCart(updatedCart);
        playBeep();
        toast.success(`${product.nome} adicionado`);
      } else {
        toast.error('Código não encontrado');
        scannerInputRef.current?.classList.add('animate-shake');
        setTimeout(() => {
          scannerInputRef.current?.classList.remove('animate-shake');
        }, 500);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar item');
    }
  };

  useBarcodeScanner({
    onScan: handleScan,
    enabled: activeTab === 'vender' && !showSearch && !showDiscountItem && !showDiscountGlobal,
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchProducts(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddProductFromSearch = async (productId: string) => {
    try {
      const updatedCart = await addToCart(productId);
      setCart(updatedCart);
      toast.success('Produto adicionado');
      setShowSearch(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar');
    }
  };

  const handleUpdateQtd = async (productId: string, qtd: number) => {
    try {
      const updatedCart = await updateCartItem(productId, qtd);
      setCart(updatedCart);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const updatedCart = await removeFromCart(productId);
      setCart(updatedCart);
      toast.success('Item removido');
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  const handleApplyItemDiscount = async () => {
    if (selectedItemIndex < 0 || !cart[selectedItemIndex]) {
      toast.error('Selecione um item');
      return;
    }

    const item = cart[selectedItemIndex];
    const value = parseFloat(discountValue);
    
    if (isNaN(value) || value < 0) {
      toast.error('Valor inválido');
      return;
    }

    try {
      const discountAmount = discountType === 'percent' 
        ? (item.qtd * item.precoUnit * value) / 100
        : value;

      const updatedCart = await applyItemDiscount(item.productId, discountAmount);
      setCart(updatedCart);
      toast.success('Desconto aplicado');
      setShowDiscountItem(false);
      setDiscountValue('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao aplicar desconto');
    }
  };

  const handleApplyGlobalDiscount = () => {
    const value = parseFloat(discountValue);
    
    if (isNaN(value) || value < 0) {
      toast.error('Valor inválido');
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = discountType === 'percent' ? (subtotal * value) / 100 : value;

    if (discountAmount > subtotal) {
      toast.error('Desconto não pode ser maior que o subtotal');
      return;
    }

    setDiscount(discountAmount);
    toast.success('Desconto aplicado');
    setShowDiscountGlobal(false);
    setDiscountValue('');
  };

  const handleApplyCoupon = () => {
    const discountAmount = applyDiscount(cart, couponCode);
    if (discountAmount > 0) {
      setDiscount(discountAmount);
      toast.success('Cupom aplicado');
    } else {
      toast.error('Cupom inválido');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    if (!session || session.status !== 'Aberto') {
      toast.error('Abra uma sessão de caixa primeiro');
      return;
    }
    navigate('/erp/pdv/checkout', { state: { discount } });
  };

  const handleRefund = async (saleId: string) => {
    try {
      await refundSale(saleId);
      await loadSales();
      toast.success('Venda estornada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao estornar');
    }
  };

  const handleCancelSale = () => {
    setCart([]);
    setDiscount(0);
    setCouponCode('');
    setShowCancelSale(false);
    toast.success('Venda cancelada');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      { key: 'F1', handler: () => setShowHelp(true) },
      { key: 'F2', handler: () => setShowSearch(true), disabled: activeTab !== 'vender' },
      { key: 'F5', handler: () => scannerInputRef.current?.focus(), disabled: activeTab !== 'vender' },
      { key: 'F6', handler: () => selectedItemIndex >= 0 && setShowDiscountItem(true), disabled: activeTab !== 'vender' },
      { key: 'F7', handler: () => {
        if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
          handleUpdateQtd(cart[selectedItemIndex].productId, Math.max(1, cart[selectedItemIndex].qtd - 1));
        }
      }, disabled: activeTab !== 'vender' },
      { key: 'F8', handler: () => setShowDiscountGlobal(true), disabled: activeTab !== 'vender' },
      { key: 'F10', handler: handleCheckout, disabled: activeTab !== 'vender' },
      { key: 'Delete', handler: () => {
        if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
          handleRemoveItem(cart[selectedItemIndex].productId);
        }
      }, disabled: activeTab !== 'vender' },
      { key: 'Escape', handler: () => setShowCancelSale(true), disabled: activeTab !== 'vender' || cart.length === 0 },
      { key: 'k', ctrl: true, handler: () => setShowSearch(true), disabled: activeTab !== 'vender' },
      { key: 'b', ctrl: true, handler: () => document.getElementById('coupon-input')?.focus(), disabled: activeTab !== 'vender' },
    ],
    activeTab === 'vender' && !showSearch && !showHelp && !showDiscountItem && !showDiscountGlobal && !showCancelSale
  );

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList>
            <TabsTrigger value="vender">Vender</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="vender" className="flex-1 m-0 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 h-full">
            {/* Left Column - Cart Items */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    <CardTitle>Itens da Venda</CardTitle>
                  </div>
                  <Badge variant="secondary">{cart.length} itens</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <ScanLine className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Escaneie ou digite o código do produto</p>
                    <p className="text-sm mt-2">Use F2 para busca por descrição</p>
                  </div>
                ) : (
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Unitário</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item, index) => (
                          <TableRow
                            key={item.productId}
                            className={cn(
                              'cursor-pointer',
                              selectedItemIndex === index && 'bg-primary/10'
                            )}
                            onClick={() => setSelectedItemIndex(index)}
                          >
                            <TableCell className="font-medium">{item.nome}</TableCell>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQtd(item.productId, item.qtd - 1);
                                  }}
                                  disabled={item.qtd <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.qtd}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQtd(item.productId, item.qtd + 1);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {item.precoUnit.toFixed(2)}
                              {item.descontoItem > 0 && (
                                <div className="text-xs text-secondary">
                                  -R$ {item.descontoItem.toFixed(2)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              R$ {item.subtotal.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveItem(item.productId);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Right Column - Scanner & Totals */}
            <div className="space-y-4">
              {/* Scanner Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ScanLine className="h-4 w-4" />
                    Scanner / Código
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      ref={scannerInputRef}
                      placeholder="Escaneie ou digite o código de barras..."
                      className={cn(
                        'h-12 text-lg border-2',
                        scannerFocused ? 'border-green-500' : 'border-amber-500'
                      )}
                      autoFocus
                      onFocus={() => setScannerFocused(true)}
                      onBlur={() => setScannerFocused(false)}
                    />
                    {!scannerFocused && (
                      <Badge variant="destructive" className="absolute -top-2 right-2">
                        Scanner OFF (F5 para focar)
                      </Badge>
                    )}
                  </div>

                  {/* Keyboard shortcuts legend */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">F2</kbd> Buscar
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">F3</kbd> Qtd
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">F4</kbd> Finalizar Item
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">F6</kbd> Desc. Item
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">F8</kbd> Desc. Geral
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">F10</kbd> Finalizar
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">DEL</kbd> Excluir
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded">ESC</kbd> Cancelar
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="flex gap-2">
                    <Input
                      id="coupon-input"
                      placeholder="Cupom de desconto"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleApplyCoupon}>
                      Aplicar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Totals Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Totais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto Geral</span>
                      <span className="text-secondary">- R$ {discount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-lg font-bold">TOTAL</span>
                      <span className="text-3xl font-bold text-green-600">
                        R$ {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || !session || session.status !== 'Aberto'}
                  >
                    Finalizar Venda (F10)
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDiscountGlobal(true)}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Desconto (F8)
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCancelSale(true)}
                      disabled={cart.length === 0}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Session Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operador:</span>
                      <span className="font-medium">{session?.operador || 'Não logado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={session?.status === 'Aberto' ? 'default' : 'secondary'}>
                        {session?.status || 'Fechado'}
                      </Badge>
                    </div>
                    {session?.status !== 'Aberto' && (
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => navigate('/erp/pdv/sessao')}
                      >
                        Abrir Caixa
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="flex-1 m-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>Últimas vendas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhuma venda registrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                          <TableCell>
                            {new Date(sale.data).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>{sale.operador}</TableCell>
                          <TableCell>{sale.itens.length}</TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {sale.total.toFixed(2)}
                          </TableCell>
                          <TableCell>{sale.pagamento}</TableCell>
                          <TableCell>
                            <Badge variant={sale.status === 'Pago' ? 'default' : 'destructive'}>
                              {sale.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Imprimir
                              </Button>
                              {sale.status === 'Pago' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRefund(sale.id)}
                                >
                                  Estornar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fechamento" className="flex-1 m-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Fechamento de Caixa</CardTitle>
              <CardDescription>Gestão de sessão e fechamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {session?.status === 'Aberto' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Vendas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{session.vendas}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Total Vendas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {session.totalVendas.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => navigate('/erp/pdv/history')}
                  >
                    Fechar Caixa
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhuma sessão aberta</p>
                  <Button onClick={() => navigate('/erp/pdv/sessao')}>
                    Abrir Caixa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Atalhos de Teclado
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Buscar Produto</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F2</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Foco Scanner</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F5</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Desconto Item</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F6</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Diminuir Qtd</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F7</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Desconto Geral</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F8</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Finalizar Venda</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F10</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Excluir Item</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">DEL</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelar Venda</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Busca Rápida</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Foco Cupom</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+B</kbd>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Buscar Produto</DialogTitle>
            <DialogDescription>Digite o nome, SKU ou código do produto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <ScrollArea className="h-96">
              <div className="grid grid-cols-2 gap-4">
                {searchResults.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleAddProductFromSearch(product.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{product.nome}</CardTitle>
                      <CardDescription className="text-xs">
                        SKU: {product.sku} | Estoque: {product.estoque}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold">R$ {product.preco.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Item Dialog */}
      <Dialog open={showDiscountItem} onOpenChange={setShowDiscountItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconto no Item</DialogTitle>
            <DialogDescription>
              {cart[selectedItemIndex]?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Desconto</Label>
              <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Porcentagem (%)</SelectItem>
                  <SelectItem value="value">Valor (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '10' : '5.00'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscountItem(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyItemDiscount}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Global Dialog */}
      <Dialog open={showDiscountGlobal} onOpenChange={setShowDiscountGlobal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconto Geral</DialogTitle>
            <DialogDescription>Aplicar desconto no total da venda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Desconto</Label>
              <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Porcentagem (%)</SelectItem>
                  <SelectItem value="value">Valor (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '10' : '50.00'}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Subtotal: R$ {subtotal.toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscountGlobal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyGlobalDiscount}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Sale Dialog */}
      <Dialog open={showCancelSale} onOpenChange={setShowCancelSale}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Venda</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta venda? Todos os itens serão removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelSale(false)}>
              Não
            </Button>
            <Button variant="destructive" onClick={handleCancelSale}>
              Sim, Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
