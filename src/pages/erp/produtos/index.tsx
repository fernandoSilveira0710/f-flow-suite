import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Eye, Pencil, Trash2, Filter, X } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockAPI, type Product } from '@/lib/mock-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ProductImage } from '@/components/products/product-image';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductFilters {
  q: string;
  status: string;
  category: string[];
  withImage: boolean;
  expiringSoon: boolean;
  days: number;
}

const defaultFilters: ProductFilters = {
  q: '',
  status: '',
  category: [],
  withImage: false,
  expiringSoon: false,
  days: 30,
};

export default function ProdutosIndex() {
  const [products, setProducts] = useState<Product[]>(mockAPI.getProducts());
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { filters, setFilters, clearFilters, activeFiltersCount } = useUrlFilters(defaultFilters);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Search
    if (filters.q) {
      const lower = filters.q.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lower) || 
        p.sku.toLowerCase().includes(lower)
      );
    }

    // Status
    if (filters.status === 'active') {
      result = result.filter(p => p.active !== false);
    } else if (filters.status === 'inactive') {
      result = result.filter(p => p.active === false);
    }

    // Category
    if (filters.category.length > 0) {
      result = result.filter(p => {
        const category = mockAPI.getCategories().find(c => c.id === p.categoryId);
        return category && filters.category.includes(category.name);
      });
    }

    // With Image
    if (filters.withImage) {
      result = result.filter(p => !!p.imageUrl);
    }

    // Expiring soon (mock - produtos sem validade específica)
    if (filters.expiringSoon) {
      // Mock: filtra aleatoriamente alguns produtos
      result = result.filter((_, i) => i % 3 === 0);
    }

    return result;
  }, [products, filters]);

  const handleDelete = (product: Product) => {
    setProducts(products.filter(p => p.id !== product.id));
    setProductToDelete(null);
  };

  if (products.length === 0) {
    return (
      <>
        <PageHeader
          title="Produtos"
          description="Gerencie seu catálogo de produtos"
        />
        <EmptyState
          icon={Plus}
          title="Nenhum produto cadastrado"
          description="Comece criando seu primeiro produto"
          actionLabel="Novo Produto"
          onAction={() => {}}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description={`${products.length} produtos cadastrados`}
      />

      {/* Search and actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos... (Ctrl+K)"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover filtros aplicados</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button asChild>
          <Link to="/erp/produtos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Link>
        </Button>
      </div>

      {/* Products table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
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
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {mockAPI.getCategories().find(c => c.id === product.categoryId)?.name || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    R$ {product.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
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
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/erp/produtos/${product.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/erp/produtos/${product.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setProductToDelete(product)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{productToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && handleDelete(productToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
