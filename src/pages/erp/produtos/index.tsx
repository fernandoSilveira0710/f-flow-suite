import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Package } from 'lucide-react';
import { mockAPI, Product } from '@/lib/mock-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { ProductImage } from '@/components/products/product-image';

export default function ProdutosIndex() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(mockAPI.getProducts());
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (mockAPI.deleteProduct(id)) {
      setProducts(mockAPI.getProducts());
      toast({
        title: 'Produto excluído',
        description: 'O produto foi removido com sucesso.',
      });
    }
  };

  if (products.length === 0) {
    return (
      <div>
        <PageHeader title="Produtos" description="Gerencie seus produtos" />
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Comece adicionando seu primeiro produto ao catálogo."
          actionLabel="Criar Produto"
          onAction={() => navigate('/erp/produtos/novo')}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`${products.length} produtos cadastrados`}
        actionLabel="Novo Produto"
        actionIcon={Plus}
        onAction={() => navigate('/erp/produtos/novo')}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductImage
                        imageUrl={product.imageUrl}
                        productName={product.name}
                        size={40}
                        className="rounded-md"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    {mockAPI.getCategories().find(c => c.id === product.categoryId)?.name || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={product.stock < 10 ? 'text-destructive font-semibold' : ''}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.active ? 'default' : 'secondary'}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/erp/produtos/${product.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/erp/produtos/${product.id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
