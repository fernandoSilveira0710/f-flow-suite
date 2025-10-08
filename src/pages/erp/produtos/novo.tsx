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
import { mockAPI } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ImageUpload } from '@/components/products/image-upload';

export default function ProdutosNovo() {
  const navigate = useNavigate();
  const categories = mockAPI.getCategories();
  const unitsOfMeasure = mockAPI.getUnitsOfMeasure();

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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product = mockAPI.createProduct({
      name: formData.name,
      description: formData.description,
      sku: formData.sku,
      barcode: formData.barcode,
      categoryId: formData.categoryId,
      unitOfMeasureId: formData.unitOfMeasureId,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock: parseInt(formData.stock),
      minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
      active: formData.active,
      imageUrl: formData.imageUrl,
    });

    toast({
      title: 'Produto criado!',
      description: `${product.name} foi adicionado ao catálogo.`,
    });

    navigate('/erp/produtos');
  };

  return (
    <div>
      <PageHeader
        title="Novo Produto"
        description="Adicione um novo produto ao catálogo"
      />

      <Button
        variant="ghost"
        onClick={() => navigate('/erp/produtos')}
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
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    required
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
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Preço de Venda *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Custo</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Estoque Inicial *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    placeholder="0"
                    min="0"
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
            <Button type="submit">Criar Produto</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/erp/produtos')}>
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
