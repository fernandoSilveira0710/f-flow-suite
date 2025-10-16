import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import { getProductById, updateProduct, type ProductResponse } from '@/lib/products-api';
import { adjustStock } from '@/lib/stock-api';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/products/image-upload';
import { mockAPI } from '@/lib/mock-data';

export default function ProdutoEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const categories = mockAPI.getCategories();
  const unitsOfMeasure = mockAPI.getUnitsOfMeasure();
  const [currentStockEdit, setCurrentStockEdit] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    unitOfMeasureId: '',
    price: '',
    cost: '',
    minStock: '',
    active: true,
    imageUrl: undefined as string | undefined,
  });

  useEffect(() => {
    let mounted = true;
    console.info('[ProdutoEditar] Tela de edição aberta', { id });
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        console.info('[ProdutoEditar] Iniciando carregamento do produto', { id });
        const p = await getProductById(id);
        if (mounted) {
          setProduct(p);
          console.info('[ProdutoEditar] Produto carregado com sucesso', { id: p.id, name: p.name });
          const selectedCategoryId = p.category
            ? (categories.find(c => c.name === p.category)?.id || '')
            : '';
          const selectedUnitId = p.unit
            ? (unitsOfMeasure.find(u => u.abbreviation === p.unit)?.id || '')
            : '';
          setFormData({
            name: p.name || '',
            description: p.description || '',
            sku: p.sku || '',
            barcode: p.barcode || '',
            categoryId: selectedCategoryId,
            unitOfMeasureId: selectedUnitId,
            price: p.price.toFixed(2),
            cost: (p.cost ?? 0).toFixed(2),
            minStock: p.minStock?.toString() || '',
            active: p.active,
            imageUrl: p.imageUrl,
          });
          setCurrentStockEdit(String(p.currentStock ?? 0));
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        toast({
          title: 'Erro ao carregar produto',
          description:
            (error as any)?.message || 'Não foi possível obter os dados do produto.',
          variant: 'destructive',
        });
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
        console.info('[ProdutoEditar] Finalizou carregamento', { id, loadingEnded: true });
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Carregando produto..." />
        <Button onClick={() => navigate('/erp/produtos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <PageHeader title="Produto não encontrado" />
        <Button onClick={() => navigate('/erp/produtos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  // Máscara de moeda com ponto: converte SEMPRE a partir de dígitos para centavos
  // Exemplos: "1" -> "0.01", "199" -> "1.99", "1234" -> "12.34"
  // Ignora ponto digitado previamente para evitar travar a digitação
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
    setFormData({ ...formData, [field]: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;
    try {
      const categoryName = formData.categoryId
        ? categories.find(c => c.id === formData.categoryId)?.name
        : undefined;
      const unitAbbr = formData.unitOfMeasureId
        ? unitsOfMeasure.find(u => u.id === formData.unitOfMeasureId)?.abbreviation
        : undefined;

      const updated = await updateProduct(id, {
        name: formData.name,
        description: formData.description || undefined,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        category: categoryName,
        unit: unitAbbr,
        price: parseFloat(formData.price.replace(',', '.')),
        cost: formData.cost ? parseFloat(formData.cost.replace(',', '.')) : undefined,
        minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
        active: formData.active,
        imageUrl: formData.imageUrl,
      });

      // Ajuste de estoque atual, caso o valor tenha sido alterado
      const desiredStock = currentStockEdit.trim() === '' ? NaN : parseInt(currentStockEdit, 10);
      if (!Number.isNaN(desiredStock)) {
        const baseStock = product?.currentStock ?? 0;
        if (desiredStock !== baseStock) {
          const delta = desiredStock - baseStock;
          await adjustStock({
            productId: id,
            delta,
            reason: 'Ajuste Manual (Editar Produto)',
            notes: `Ajuste aplicado na tela de edição. De ${baseStock} para ${desiredStock}.`,
          });
        }
      }

      toast({
        title: 'Produto atualizado!',
        description: `${formData.name} foi atualizado com sucesso.`,
      });

      // Recarrega produto para refletir estoque atualizado antes de navegar
      try {
        const refreshed = await getProductById(id);
        setProduct(refreshed);
      } catch {}
      navigate(`/erp/produtos/${id}`);
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: 'Erro ao atualizar produto',
        description: error?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Editar Produto"
        description={`Editando: ${product.name}`}
      />

      <Button
        variant="ghost"
        onClick={() => navigate(`/erp/produtos/${id}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
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
                productName={formData.name || product.name}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
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
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitOfMeasure">Unidade de Medida</Label>
                  <Select
                    value={formData.unitOfMeasureId}
                    onValueChange={(value) => setFormData({ ...formData, unitOfMeasureId: value })}
                  >
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
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precificação e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço de Venda *</Label>
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    pattern={/^\d+(\.\d{0,2})?$/.source}
                    value={formData.price}
                    onChange={(e) => handleMoneyInputChange('price', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Custo</Label>
                  <Input
                    id="cost"
                    type="text"
                    inputMode="decimal"
                    pattern={/^\d+(\.\d{0,2})?$/.source}
                    value={formData.cost}
                    onChange={(e) => handleMoneyInputChange('cost', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentStock">Estoque Atual</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={currentStockEdit}
                    onChange={(e) => setCurrentStockEdit(e.target.value)}
                    min={0}
                    step={1}
                  />
                </div>

                <div>
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Produto Ativo</p>
                  <p className="text-sm text-muted-foreground">
                    Produtos inativos não aparecem no PDV
                  </p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit">Salvar Alterações</Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/erp/produtos/${id}`)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
