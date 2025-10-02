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
  DoorOpen,
  DoorClosed,
  TrendingDown,
  TrendingUp,
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
import { Textarea } from '@/components/ui/textarea';
import {
  getSession,
  openSession,
  closeSession,
  addCashEntry,
  findProductByBarcode,
  addToCart,
  updateCartItem,
  removeFromCart,
  getCart,
  clearCart,
  applyDiscount,
  applyItemDiscount,
  searchProducts,
  getSales,
  refundSale,
  createSale,
  CartItem,
  Session,
  Sale,
  Product,
} from '@/lib/pos-api';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { ProductImage } from '@/components/products/product-image';
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
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
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
  const couponInputRef = useRef<HTMLInputElement>(null);
  const [scannerFocused, setScannerFocused] = useState(true);
  const [beepEnabled, setBeepEnabled] = useState(true);

  // Session management
  const [saldoInicial, setSaldoInicial] = useState('100.00');
  const [sangriaValor, setSangriaValor] = useState('');
  const [sangriaObs, setSangriaObs] = useState('');
  const [suprimentoValor, setSuprimentoValor] = useState('');
  const [suprimentoObs, setSuprimentoObs] = useState('');
  const [closeObservacao, setCloseObservacao] = useState('');

  // Checkout
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [installments, setInstallments] = useState(1);

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
    if (session?.status !== 'Aberto') {
      toast.error('Caixa não está aberto');
      return;
    }

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
    enabled: activeTab === 'vender' && !showSearch && !showDiscountItem && !showDiscountGlobal && !showCheckout && !showOpenSession && !showCloseSession,
  });

  // Keyboard shortcuts
  const anyModalOpen = showHelp || showSearch || showDiscountItem || showDiscountGlobal || showCancelSale || showOpenSession || showCloseSession || showCheckout;
  
  useKeyboardShortcuts([
    { key: 'F1', handler: () => setShowHelp(true), disabled: anyModalOpen },
    { key: 'F2', handler: () => setShowSearch(true), disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F3', handler: () => {
      if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
        // Focus quantity input (implementation depends on UI)
        toast.info('Editar quantidade do item selecionado');
      }
    }, disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F4', handler: () => {
      // Finalizar item (confirm edit)
      toast.info('Item finalizado');
    }, disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F5', handler: () => {
      scannerInputRef.current?.focus();
      toast.info('Scanner focado');
    }, disabled: anyModalOpen },
    { key: 'F6', handler: () => {
      if (activeTab === 'vender') {
        setShowDiscountItem(true);
      } else if (activeTab === 'fechamento') {
        if (session?.status === 'Aberto') {
          setShowCloseSession(true);
        } else {
          setShowOpenSession(true);
        }
      }
    }, disabled: anyModalOpen },
    { key: 'F7', handler: () => {
      if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
        const item = cart[selectedItemIndex];
        if (item.qtd > 1) {
          handleUpdateQtd(item.productId, item.qtd - 1);
        }
      }
    }, disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F8', handler: () => setShowDiscountGlobal(true), disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F9', handler: () => {
      if (cart.length > 0 && session?.status === 'Aberto') {
        setPaymentMethod('PIX');
        setShowCheckout(true);
      }
    }, disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F10', handler: () => {
      if (cart.length > 0 && session?.status === 'Aberto') {
        setShowCheckout(true);
      } else if (cart.length === 0) {
        toast.error('Carrinho vazio');
      } else {
        toast.error('Caixa não está aberto');
      }
    }, disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F11', handler: () => {
      if (cart.length > 0 && session?.status === 'Aberto') {
        setPaymentMethod('Cartão Crédito');
        setShowCheckout(true);
      }
    }, disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'F12', handler: () => {
      // Estornar venda selecionada
      toast.info('F12: Estornar venda selecionada');
    }, disabled: anyModalOpen || activeTab !== 'historico' },
    { key: 'Delete', handler: () => {
      if (selectedItemIndex >= 0 && cart[selectedItemIndex]) {
        handleRemoveItem(cart[selectedItemIndex].productId);
      }
    }, disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'Escape', handler: () => setShowCancelSale(true), disabled: anyModalOpen || activeTab !== 'vender' || cart.length === 0 },
    { key: 'k', ctrl: true, handler: () => setShowSearch(true), disabled: anyModalOpen || activeTab !== 'vender' },
    { key: 'b', ctrl: true, handler: () => couponInputRef.current?.focus(), disabled: anyModalOpen || activeTab !== 'vender' },
  ], !anyModalOpen);

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
      setSelectedItemIndex(-1);
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
      toast.success(`Cupom ${couponCode} aplicado!`);
      setCouponCode('');
    } else {
      toast.error('Cupom inválido');
    }
  };

  const handleCancelSale = () => {
    clearCart();
    setCart([]);
    setDiscount(0);
    setCouponCode('');
    setSelectedItemIndex(-1);
    setShowCancelSale(false);
    toast.success('Venda cancelada');
  };

  const handleRefund = async (saleId: string) => {
    try {
      await refundSale(saleId);
      toast.success('Venda estornada com sucesso');
      loadSales();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao estornar');
    }
  };

  const handleOpenSession = async () => {
    const valor = parseFloat(saldoInicial);
    if (isNaN(valor) || valor < 0) {
      toast.error('Valor inválido');
      return;
    }

    try {
      const newSession = await openSession(valor, { id: 'admin-1', nome: 'Admin Demo' });
      setSession(newSession);
      setShowOpenSession(false);
      toast.success('Caixa aberto com sucesso!');
      setSaldoInicial('100.00');
      scannerInputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir caixa');
    }
  };

  const handleCloseSession = async () => {
    try {
      if (cart.length > 0) {
        toast.error('Finalize ou cancele a venda atual antes de fechar o caixa');
        return;
      }

      await closeSession(closeObservacao);
      setSession(null);
      setShowCloseSession(false);
      toast.success('Caixa fechado com sucesso!');
      setCloseObservacao('');
      loadSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fechar caixa');
    }
  };

  const handleAddSangria = async () => {
    const valor = parseFloat(sangriaValor);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor inválido');
      return;
    }

    try {
      const updatedSession = await addCashEntry('SANGRIA', valor, sangriaObs);
      setSession(updatedSession);
      setSangriaValor('');
      setSangriaObs('');
      toast.success('Sangria registrada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar sangria');
    }
  };

  const handleAddSuprimento = async () => {
    const valor = parseFloat(suprimentoValor);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor inválido');
      return;
    }

    try {
      const updatedSession = await addCashEntry('SUPRIMENTO', valor, suprimentoObs);
      setSession(updatedSession);
      setSuprimentoValor('');
      setSuprimentoObs('');
      toast.success('Suprimento registrado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar suprimento');
    }
  };

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast.error('Selecione a forma de pagamento');
      return;
    }

    try {
      const sale = await createSale(cart, paymentMethod, paymentMethod === 'Cartão Crédito' ? installments : undefined, discount);
      setCart([]);
      setDiscount(0);
      setCouponCode('');
      setSelectedItemIndex(-1);
      setShowCheckout(false);
      toast.success(`Venda #${sale.id} finalizada!`);
      loadSession();
      loadSales();
      setPaymentMethod('');
      setInstallments(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao finalizar venda');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(subtotal - discount, 0);

  // Calculate session totals
  const sessionTotals = session && session.status === 'Aberto' ? (() => {
    const allSales = JSON.parse(localStorage.getItem('2f.pos.sales') || '[]');
    const sessionSales = allSales.filter((s: any) => 
      session.vendasIds.includes(s.id) && s.status === 'Pago'
    );
    
    const totalVendas = sessionSales.reduce((sum: number, s: any) => sum + s.total, 0);
    const totalDinheiro = sessionSales.filter((s: any) => s.pagamento === 'Dinheiro').reduce((sum: number, s: any) => sum + s.total, 0);
    const totalCartao = sessionSales.filter((s: any) => s.pagamento.includes('Cartão')).reduce((sum: number, s: any) => sum + s.total, 0);
    const totalPix = sessionSales.filter((s: any) => s.pagamento === 'PIX').reduce((sum: number, s: any) => sum + s.total, 0);
    const totalSangria = session.cash.filter(c => c.tipo === 'SANGRIA').reduce((sum, c) => sum + c.valor, 0);
    const totalSuprimento = session.cash.filter(c => c.tipo === 'SUPRIMENTO').reduce((sum, c) => sum + c.valor, 0);
    const saldoFinalCalculado = session.saldoInicial + totalSuprimento - totalSangria + totalDinheiro;
    
    return { totalVendas, totalDinheiro, totalCartao, totalPix, totalSangria, totalSuprimento, saldoFinalCalculado, qtdVendas: sessionSales.length };
  })() : null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">PDV</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Operador:</span>
            <span className="font-medium">{session?.operador?.nome || 'Não logado'}</span>
          </div>
          <Badge variant={session?.status === 'Aberto' ? 'default' : 'secondary'}>
            {session?.status === 'Aberto' ? (
              <><DoorOpen className="h-3 w-3 mr-1" /> Aberto</>
            ) : (
              <><DoorClosed className="h-3 w-3 mr-1" /> Fechado</>
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(true)}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Atalhos (F1)
          </Button>
          {session?.status !== 'Aberto' ? (
            <Button onClick={() => setShowOpenSession(true)}>
              Abrir Caixa
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setShowCloseSession(true)}>
              Fechar Caixa
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4">
          <TabsTrigger value="vender">Vender</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
        </TabsList>

        {/* Vender Tab */}
        <TabsContent value="vender" className="flex-1 m-0 p-6">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6 h-full">
            {/* Left: Items */}
            <div className="space-y-4">
              <Card className="h-full min-h-[60vh] flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Itens da Venda</CardTitle>
                    <Badge variant="secondary">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <ScanLine className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Escaneie ou digite o código do produto</p>
                      <p className="text-sm">Use F2 para busca por descrição</p>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-center">Qtd</TableHead>
                            <TableHead className="text-right">Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cart.map((item, index) => (
                            <TableRow 
                              key={item.productId}
                              className={cn(
                                "cursor-pointer",
                                selectedItemIndex === index && "bg-muted"
                              )}
                              onClick={() => setSelectedItemIndex(index)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <ProductImage
                                    imageUrl={item.imageUrl}
                                    productName={item.nome}
                                    size={32}
                                    className="rounded"
                                  />
                                  {item.nome}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">{item.sku}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.qtd > 1) handleUpdateQtd(item.productId, item.qtd - 1);
                                    }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center">{item.qtd}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
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
                              <TableCell className="text-right">R$ {item.precoUnit.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                R$ {item.subtotal.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
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
            </div>

            {/* Right: Scanner & Totals */}
            <div className="space-y-4">
              {/* Scanner */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Scanner / Código
                    {!scannerFocused && (
                      <Badge variant="destructive" className="text-xs">
                        OFF (F5 para focar)
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    ref={scannerInputRef}
                    placeholder="Escaneie ou digite o código de barras..."
                    className="border-green-600 focus:ring-green-600 text-lg h-12"
                    autoFocus
                    disabled={session?.status !== 'Aberto'}
                  />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>F2</span>
                      <span>Buscar</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>F6</span>
                      <span>Desc. Item</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>F3</span>
                      <span>Qtd</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>F8</span>
                      <span>Desc. Geral</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>F4</span>
                      <span>Finalizar Item</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>F10</span>
                      <span>Finalizar Venda</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>DEL</span>
                      <span>Excluir Item</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Totals */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-sm">Totais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto Geral:</span>
                      <span className="text-red-600">- R$ {discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-3xl font-bold pt-2 border-t">
                      <span>TOTAL:</span>
                      <span className="text-green-600">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        ref={couponInputRef}
                        placeholder="Cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <Button onClick={handleApplyCoupon}>Aplicar</Button>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-lg"
                    onClick={() => {
                      if (cart.length === 0) {
                        toast.error('Carrinho vazio');
                      } else if (session?.status !== 'Aberto') {
                        toast.error('Caixa não está aberto');
                      } else {
                        setShowCheckout(true);
                      }
                    }}
                    disabled={cart.length === 0 || session?.status !== 'Aberto'}
                  >
                    Finalizar Venda (F10)
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDiscountGlobal(true)}
                      disabled={cart.length === 0}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Desconto (F8)
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCancelSale(true)}
                      disabled={cart.length === 0}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Historico Tab */}
        <TabsContent value="historico" className="flex-1 m-0 p-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>Vendas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead className="text-center">Itens</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhuma venda registrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.id}</TableCell>
                          <TableCell>{new Date(sale.data).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{sale.operador}</TableCell>
                          <TableCell className="text-center">{sale.itens.length}</TableCell>
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
                                  Estornar (F12)
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

        {/* Fechamento Tab */}
        <TabsContent value="fechamento" className="flex-1 m-0 p-6">
          {session?.status !== 'Aberto' ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <DoorClosed className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                  <div>
                    <p className="text-lg font-medium">Nenhuma sessão aberta</p>
                    <p className="text-sm text-muted-foreground">Abra um caixa para começar a operar</p>
                  </div>
                  <Button onClick={() => setShowOpenSession(true)}>
                    <DoorOpen className="h-4 w-4 mr-2" />
                    Abrir Caixa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Saldo Inicial</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">R$ {session.saldoInicial.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{sessionTotals?.qtdVendas || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {(sessionTotals?.totalVendas || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Saldo Previsto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {(sessionTotals?.saldoFinalCalculado || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sangria & Suprimento */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      Sangria
                    </CardTitle>
                    <CardDescription>Retirada de dinheiro do caixa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sangriaValor}
                        onChange={(e) => setSangriaValor(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Observação (opcional)</Label>
                      <Textarea
                        value={sangriaObs}
                        onChange={(e) => setSangriaObs(e.target.value)}
                        placeholder="Motivo da sangria..."
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={handleAddSangria}
                      disabled={!sangriaValor}
                      variant="destructive"
                      className="w-full"
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Registrar Sangria
                    </Button>
                    {session.cash.filter(c => c.tipo === 'SANGRIA').length > 0 && (
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-sm font-medium">Histórico:</p>
                        {session.cash.filter(c => c.tipo === 'SANGRIA').map(c => (
                          <div key={c.id} className="text-xs flex justify-between">
                            <span className="text-muted-foreground">
                              {new Date(c.dataISO).toLocaleTimeString('pt-BR')}
                            </span>
                            <span className="font-medium">R$ {c.valor.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Suprimento
                    </CardTitle>
                    <CardDescription>Adição de dinheiro ao caixa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={suprimentoValor}
                        onChange={(e) => setSuprimentoValor(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Observação (opcional)</Label>
                      <Textarea
                        value={suprimentoObs}
                        onChange={(e) => setSuprimentoObs(e.target.value)}
                        placeholder="Motivo do suprimento..."
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={handleAddSuprimento}
                      disabled={!suprimentoValor}
                      className="w-full"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Registrar Suprimento
                    </Button>
                    {session.cash.filter(c => c.tipo === 'SUPRIMENTO').length > 0 && (
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-sm font-medium">Histórico:</p>
                        {session.cash.filter(c => c.tipo === 'SUPRIMENTO').map(c => (
                          <div key={c.id} className="text-xs flex justify-between">
                            <span className="text-muted-foreground">
                              {new Date(c.dataISO).toLocaleTimeString('pt-BR')}
                            </span>
                            <span className="font-medium">R$ {c.valor.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Parcial</CardTitle>
                  <CardDescription>Valores por forma de pagamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Dinheiro</p>
                      <p className="text-xl font-bold">R$ {(sessionTotals?.totalDinheiro || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Cartão</p>
                      <p className="text-xl font-bold">R$ {(sessionTotals?.totalCartao || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">PIX</p>
                      <p className="text-xl font-bold">R$ {(sessionTotals?.totalPix || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Sangria</p>
                      <p className="text-xl font-bold text-red-600">- R$ {(sessionTotals?.totalSangria || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Close Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowCloseSession(true)}
                  >
                    <DoorClosed className="h-5 w-5 mr-2" />
                    Fechar Caixa (F6)
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
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
                <span className="text-sm">Ajuda</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F1</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Buscar Produto</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F2</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Editar Qtd</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F3</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Finalizar Item</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F4</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Foco Scanner</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F5</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Desconto Item / Abrir-Fechar</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F6</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Diminuir Qtd</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F7</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Desconto Geral</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F8</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PIX Rápido</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F9</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Finalizar Venda</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F10</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Crédito</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F11</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Estornar</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">F12</kbd>
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
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleAddProductFromSearch(product.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <ProductImage
                          imageUrl={product.imageUrl}
                          productName={product.nome}
                          size={48}
                          className="rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{product.nome}</h3>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-bold">R$ {product.preco.toFixed(2)}</p>
                        <Badge variant={product.estoque > 0 ? 'default' : 'destructive'}>
                          Estoque: {product.estoque}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Discount Dialog */}
      <Dialog open={showDiscountItem} onOpenChange={setShowDiscountItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconto no Item</DialogTitle>
            <DialogDescription>
              {selectedItemIndex >= 0 && cart[selectedItemIndex] 
                ? `Aplicar desconto em: ${cart[selectedItemIndex].nome}`
                : 'Selecione um item primeiro'}
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
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="value">Valor (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
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

      {/* Global Discount Dialog */}
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
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="value">Valor (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '10' : '5.00'}
              />
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

      {/* Cancel Sale Confirmation */}
      <AlertDialog open={showCancelSale} onOpenChange={setShowCancelSale}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os itens do carrinho serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSale}>Sim, Cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Open Session Dialog */}
      <Dialog open={showOpenSession} onOpenChange={setShowOpenSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Abrir Caixa
            </DialogTitle>
            <DialogDescription>Informe o saldo inicial para abrir o caixa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="saldoInicial">Saldo Inicial (R$)</Label>
              <Input
                id="saldoInicial"
                type="number"
                step="0.01"
                min="0"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Data/Hora: {new Date().toLocaleString('pt-BR')}</p>
              <p>• Operador: Admin Demo</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenSession(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenSession}>Confirmar Abertura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={showCloseSession} onOpenChange={setShowCloseSession}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorClosed className="h-5 w-5" />
              Fechar Caixa
            </DialogTitle>
            <DialogDescription>Confira o resumo antes de fechar</DialogDescription>
          </DialogHeader>
          {sessionTotals && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                  <p className="text-lg font-bold">R$ {session!.saldoInicial.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
                  <p className="text-lg font-bold">{sessionTotals.qtdVendas}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Dinheiro</p>
                  <p className="text-lg font-bold">R$ {sessionTotals.totalDinheiro.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cartão</p>
                  <p className="text-lg font-bold">R$ {sessionTotals.totalCartao.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">PIX</p>
                  <p className="text-lg font-bold">R$ {sessionTotals.totalPix.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Vendas</p>
                  <p className="text-lg font-bold text-green-600">R$ {sessionTotals.totalVendas.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Suprimentos</p>
                  <p className="text-lg font-bold text-green-600">+ R$ {sessionTotals.totalSuprimento.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Sangrias</p>
                  <p className="text-lg font-bold text-red-600">- R$ {sessionTotals.totalSangria.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Saldo Final Calculado</p>
                  <p className="text-3xl font-bold text-blue-600">R$ {sessionTotals.saldoFinalCalculado.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <Label>Observação (opcional)</Label>
                <Textarea
                  value={closeObservacao}
                  onChange={(e) => setCloseObservacao(e.target.value)}
                  placeholder="Observações sobre o fechamento..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseSession(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCloseSession}>
              Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>Selecione a forma de pagamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total a pagar:</span>
                <span className="text-3xl font-bold text-green-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                  <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === 'Cartão Crédito' && (
              <div>
                <Label>Parcelas</Label>
                <Select value={installments.toString()} onValueChange={(v) => setInstallments(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}x de R$ {(total / n).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={!paymentMethod}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
