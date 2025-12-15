import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { mockAPI, UnitOfMeasure } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/products/image-upload';
import { createProduct } from '@/lib/products-api';
import { adjustStock } from '@/lib/stock-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Category, fetchCategories, createCategory } from '@/lib/categories-api';

export default function ProdutosNovo() {
  const navigate = useNavigate();
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<UnitOfMeasure[]>(mockAPI.getUnitsOfMeasure());

  // Categorias do client-local
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err: any) {
        console.error('Erro ao carregar categorias:', err);
        toast({
          title: 'Erro ao carregar categorias',
          description: err?.message || 'Falha ao obter categorias do servidor',
          variant: 'destructive',
        });
      }
    };
    loadCategories();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    unitOfMeasureId: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    active: true,
    imageUrl: undefined as string | undefined,
    marginPct: '',
    expiryDate: '',
  });

  // Controle de modo de precificação: null (nada decidido), 'margin' ou 'cost'
  const [pricingMode, setPricingMode] = useState<'margin' | 'price' | null>(null);

  // Máscara de moeda a partir de dígitos (centavos)
  const applyMoneyMask = (raw: string): string => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (digits === '') return '';
    if (digits.length <= 2) {
      return `0.${digits.padStart(2, '0')}`;
    }
    const intPartNum = parseInt(digits.slice(0, -2), 10);
    const intPart = Number.isNaN(intPartNum) ? '0' : String(intPartNum);
    const decPart = digits.slice(-2);
    return `${intPart}.${decPart}`;
  };

  const handleMoneyInputChange = (field: 'price' | 'cost', raw: string) => {
    const formatted = applyMoneyMask(raw);
    const next = { ...formData, [field]: formatted } as typeof formData;

    // Se custo muda e estamos no modo preço: recalcular margem se houver preço
    if (field === 'cost') {
      const costVal = next.cost ? parseFloat(next.cost.replace(',', '.')) : undefined;
      if (pricingMode === 'price') {
        const priceVal = next.price ? parseFloat(next.price.replace(',', '.')) : undefined;
        if (costVal !== undefined && !isNaN(costVal) && priceVal !== undefined && !isNaN(priceVal) && costVal > 0) {
          const marginPct = ((priceVal - costVal) / costVal) * 100;
          next.marginPct = marginPct.toFixed(2);
        }
      } else if (pricingMode === 'margin') {
        const marginVal = next.marginPct ? parseFloat(next.marginPct.replace(',', '.')) : undefined;
        if (costVal !== undefined && !isNaN(costVal) && marginVal !== undefined && !isNaN(marginVal)) {
          const price = costVal * (1 + marginVal / 100);
          next.price = price.toFixed(2);
        }
      }
    }

    // Se preço muda e estamos no modo preço: calcula margem
    if (field === 'price' && pricingMode === 'price') {
      const costVal = next.cost ? parseFloat(next.cost.replace(',', '.')) : undefined;
      const priceVal = next.price ? parseFloat(next.price.replace(',', '.')) : undefined;
      if (costVal !== undefined && !isNaN(costVal) && priceVal !== undefined && !isNaN(priceVal) && costVal > 0) {
        const marginPct = ((priceVal - costVal) / costVal) * 100;
        next.marginPct = marginPct.toFixed(2);
      }
    }

    // Ao editar preço, assume modo 'price' para que a margem seja derivada
    if (field === 'price') {
      const priceVal = next.price ? parseFloat(next.price.replace(',', '.')) : undefined;
      if (priceVal !== undefined && !isNaN(priceVal)) {
        setPricingMode('price');
      }
    }

    setFormData(next);
  };

  // Preço a partir da margem (%)
  const getPriceFromMargin = (): number | undefined => {
    const cost = formData.cost ? parseFloat(formData.cost.replace(',', '.')) : undefined;
    const margin = formData.marginPct ? parseFloat(formData.marginPct.replace(',', '.')) : undefined;
    if (cost === undefined || isNaN(cost) || margin === undefined || isNaN(margin)) return undefined;
    return cost * (1 + margin / 100);
  };

  // Margem (%) a partir do preço
  const getMarginFromPrice = (): number | undefined => {
    const cost = formData.cost ? parseFloat(formData.cost.replace(',', '.')) : undefined;
    const price = formData.price ? parseFloat(formData.price.replace(',', '.')) : undefined;
    if (cost === undefined || isNaN(cost) || price === undefined || isNaN(price) || cost === 0) return undefined;
    return ((price - cost) / cost) * 100;
  };

  const formatBRL = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Diálogo de nova categoria
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryActive, setNewCategoryActive] = useState(true);

  // Diálogo de nova unidade
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitActive, setNewUnitActive] = useState(true);

  const handleCreateCategoryInline = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome da categoria.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const created = await createCategory({
        name: newCategoryName.trim(),
        description: undefined,
        active: newCategoryActive,
      });
      const updated = await fetchCategories();
      setCategories(updated);
      setFormData({ ...formData, categoryId: created.id });
      setCategoryDialogOpen(false);
      toast({ title: 'Categoria criada', description: `Categoria '${created.name}' disponível na lista.` });
    } catch (err: any) {
      console.error('Erro ao criar categoria:', err);
      toast({
        title: 'Erro ao criar categoria',
        description: err?.message || 'Falha ao criar categoria',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUnitInline = () => {
    if (!newUnitName.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o nome da unidade.',
        variant: 'destructive',
      });
      return;
    }
    const defaultAbbr = (() => {
      const n = newUnitName.trim().toLowerCase();
      if (n === 'unidade') return 'un';
      if (n === 'litro') return 'l';
      if (n === 'mililitro') return 'ml';
      if (n === 'quilograma') return 'kg';
      if (n === 'grama') return 'g';
      if (n === 'metro') return 'm';
      if (n === 'centímetro' || n === 'centimetro') return 'cm';
      return n.slice(0, 3) || 'un';
    })();
    const created = mockAPI.createUnitOfMeasure({
      name: newUnitName.trim(),
      abbreviation: defaultAbbr,
      type: 'unit',
      active: newUnitActive,
    });
    setUnitsOfMeasure(mockAPI.getUnitsOfMeasure());
    setFormData({ ...formData, unitOfMeasureId: created.id });
    setUnitDialogOpen(false);
    toast({ title: 'Unidade criada', description: `Unidade '${created.name}' disponível na lista.` });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const categoryName = formData.categoryId
        ? categories.find(c => c.id === formData.categoryId)?.name
        : undefined;
      const unitAbbr = formData.unitOfMeasureId
        ? unitsOfMeasure.find(u => u.id === formData.unitOfMeasureId)?.abbreviation
        : undefined;

      const product = await createProduct({
        name: formData.name,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        price: parseFloat(formData.price.replace(',', '.')),
        cost: formData.cost ? parseFloat(formData.cost.replace(',', '.')) : undefined,
        category: categoryName,
        unit: unitAbbr,
        minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
        trackStock: true,
        active: formData.active,
        marginPct: formData.marginPct ? parseFloat(formData.marginPct.replace(',', '.')) : undefined,
        expiryDate: formData.expiryDate || undefined,
      });

      const initialQty = formData.stock ? parseInt(formData.stock) : 0;
      if (initialQty > 0) {
        await adjustStock({ productId: product.id, delta: initialQty, reason: 'INITIAL_STOCK' });
      }

      toast({ title: 'Produto criado!', description: `${product.name} foi adicionado ao catálogo.` });
      navigate('/erp/produtos');
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      const msg = error?.message || 'Tente novamente mais tarde.';
      const title = /duplicado/i.test(msg) ? 'Valor duplicado' : 'Erro ao criar produto';
      toast({ title, description: msg, variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Novo Produto" description="Adicione um novo produto ao catálogo" />

      <Button variant="ghost" onClick={() => navigate('/erp/produtos')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Imagem do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(imageUrl) => setFormData({ ...formData, imageUrl })}
                productName={formData.name || 'Novo Produto'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setNewCategoryName('');
      setNewCategoryActive(true);
      setCategoryDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Categoria
                  </Button>
                </div>

                <div>
                  <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
                  <Select value={formData.unitOfMeasureId} onValueChange={(value) => setFormData({ ...formData, unitOfMeasureId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unitsOfMeasure.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setNewUnitName('');
                      setNewUnitActive(true);
                      setUnitDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Unidade
                  </Button>
                </div>
              </div>

              {/* Dialog de nova categoria */}
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ativa</Label>
                      <Switch checked={newCategoryActive} onCheckedChange={setNewCategoryActive} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" type="button" onClick={() => setCategoryDialogOpen(false)}>Cancelar</Button>
                      <Button type="button" onClick={handleCreateCategoryInline}>
                        <Plus className="h-4 w-4 mr-2" /> Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Dialog de nova unidade de medida */}
              <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Unidade de Medida</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ativa</Label>
                      <Switch checked={newUnitActive} onCheckedChange={setNewUnitActive} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" type="button" onClick={() => setUnitDialogOpen(false)}>Cancelar</Button>
                      <Button type="button" onClick={handleCreateUnitInline}>
                        <Plus className="h-4 w-4 mr-2" /> Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
              </div>

              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Precificação e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* 1) Custo */}
                <div>
                  <Label htmlFor="cost">Custo</Label>
                  <Input
                    id="cost"
                    type="text"
                    inputMode="decimal"
                    pattern={/^\d+(\.\d{0,2})?$/.source}
                    value={formData.cost}
                    onChange={(e) => {
                      handleMoneyInputChange('cost', e.target.value);
                    }}
                  />
                </div>

                {/* 2) Margem (%) */}
                <div>
                  <Label htmlFor="marginPct">Margem (%)</Label>
                  <Input
                    id="marginPct"
                    type="text"
                    inputMode="decimal"
                    placeholder="ex.: 30"
                    value={formData.marginPct}
                    disabled={!formData.cost}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = { ...formData, marginPct: v };
                      setPricingMode('margin');
                      const costVal = next.cost ? parseFloat(next.cost.replace(',', '.')) : undefined;
                      const marginVal = next.marginPct ? parseFloat(next.marginPct.replace(',', '.')) : undefined;
                      if (costVal !== undefined && !isNaN(costVal) && marginVal !== undefined && !isNaN(marginVal)) {
                        const price = costVal * (1 + marginVal / 100);
                        next.price = price.toFixed(2);
                      }
                      setFormData(next);
                    }}
                  />
                </div>

                {/* 3) Preço de Venda */}
                <div>
                  <Label htmlFor="price">Preço de Venda *</Label>
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    pattern={/^\d+(\.\d{0,2})?$/.source}
                    value={formData.price}
                    disabled={!formData.cost}
                    onChange={(e) => {
                      setPricingMode('price');
                      handleMoneyInputChange('price', e.target.value);
                    }}
                    required
                  />
                  {(() => {
                    const m = getMarginFromPrice();
                    return m !== undefined ? (
                      <p className="text-xs text-muted-foreground mt-1">Margem calculada: {m.toFixed(2)}%</p>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stock">Estoque Inicial *</Label>
                  <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} min={0} step={1} required />
                </div>

                <div>
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input id="minStock" type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} />
                </div>

                <div>
                  <Label htmlFor="expiryDate">Validade do Produto</Label>
                  <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Produto Ativo</p>
              <p className="text-sm text-muted-foreground">Produtos inativos não aparecem no PDV</p>
            </div>
            <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
          </div>

          <div className="flex gap-4">
            <Button type="submit">Criar Produto</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/erp/produtos')}>Cancelar</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
