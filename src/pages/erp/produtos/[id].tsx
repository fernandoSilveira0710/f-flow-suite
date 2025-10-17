import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProductById, deleteProduct, type ProductResponse } from '@/lib/products-api';
import { ArrowLeft, Edit, Trash2, Barcode } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProductImage } from '@/components/products/product-image';
import { formatCurrencyDot } from '@/lib/utils';

export default function ProdutoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const p = await getProductById(id);
        if (mounted) setProduct(p);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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

  const categoryName = product.category;

  const handleDelete = async () => {
    try {
      await deleteProduct(product.id);
      toast({
        title: 'Produto excluído',
        description: 'O produto foi removido com sucesso.',
      });
      navigate('/erp/produtos');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku}`}
      />

      <div className="flex gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/erp/produtos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button asChild>
          <Link
            to={`/erp/produtos/${product.id}/editar`}
            onClick={() => {
              console.info('[ProdutoDetalhe] Clique em Editar', { id: product.id, name: product.name });
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <ProductImage
                imageUrl={product.imageUrl}
                productName={product.name}
                size={120}
                className="rounded-xl"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  <p className="text-muted-foreground">{product.description || 'Sem descrição'}</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant={product.active ? 'default' : 'secondary'}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {product.barcode && (
                    <Badge variant="outline" className="gap-1">
                      <Barcode className="h-3 w-3" />
                      Scan Ready
                    </Badge>
                  )}
                  <Badge variant="secondary">{categoryName || 'Sem categoria'}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">SKU</p>
                <p className="font-mono font-medium">{product.sku}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Código de Barras</p>
                <p className="font-mono font-medium">{product.barcode || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precificação e Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Preço de Venda</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrencyDot(product.price)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Custo</p>
                <p className="text-2xl font-bold">
                  {formatCurrencyDot(product.cost ?? 0)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Estoque Atual</p>
                <p className={`text-2xl font-bold ${product.currentStock < 10 ? 'text-destructive' : ''}`}>
                  {product.currentStock} un.
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Margem</p>
                <p className="text-lg font-semibold text-secondary">
                  {product.cost && product.cost > 0 ? (((product.price - product.cost) / product.cost) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>


              <div>
                <p className="text-sm text-muted-foreground mb-1">Validade</p>
                <p className="text-lg font-semibold">
                  {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
