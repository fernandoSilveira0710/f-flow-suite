import { ShoppingBag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/pos-api';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
        <Package className="h-12 w-12 mb-2 opacity-50" />
        <p>Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{product.nome}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  SKU: {product.sku}
                </CardDescription>
              </div>
              {product.estoque < 10 && (
                <Badge variant="destructive" className="text-xs">
                  Baixo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                R$ {product.preco.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                Estoque: {product.estoque}
              </span>
            </div>
            <Button
              className="w-full"
              onClick={() => onAddToCart(product.id)}
              disabled={product.estoque === 0}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {product.estoque === 0 ? 'Sem Estoque' : 'Adicionar'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
