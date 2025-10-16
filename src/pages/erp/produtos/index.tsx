import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Eye, Pencil, Trash2, Filter, X } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProducts as getProductsAPI, deleteProduct as deleteProductAPI, type ProductResponse } from '@/lib/products-api';
import { toast } from '@/hooks/use-toast';
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
import { formatCurrencyDot } from '@/lib/utils';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductFilters {
  q: string;
  status: 'all' | 'active' | 'inactive';
  category: string[];
  withImage: boolean;
  expiringSoon: boolean;
  days: number;
}

const defaultFilters: ProductFilters = {
  q: '',
  status: 'all',
  category: [],
  withImage: false,
  expiringSoon: false,
  days: 30,
};

export default function ProdutosIndex() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);
  const { filters, setFilters, clearFilters, activeFiltersCount } = useUrlFilters(defaultFilters);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProductsAPI();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      }
    })();
  }, []);

  // Categorias únicas para filtros
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Search
    if (filters.q) {
      const lower = filters.q.trim().toLowerCase();
      if (lower) {
        result = result.filter((p) => {
          const name = (p.name ?? '').toLowerCase();
          const sku = (p.sku ?? '').toLowerCase();
          const barcode = (p.barcode ?? '').toLowerCase();
          return (
            name.includes(lower) ||
            sku.includes(lower) ||
            barcode.includes(lower)
          );
        });
      }
    }

    // Status
    if (filters.status === 'active') {
      result = result.filter(p => p.active !== false);
    } else if (filters.status === 'inactive') {
      result = result.filter(p => p.active === false);
    }

    // Category
    if (filters.category.length > 0) {
      result = result.filter(p => p.category && filters.category.includes(p.category));
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

  const handleDelete = async (product: ProductResponse) => {
    try {
      await deleteProductAPI(product.id);
      setProducts(products.filter(p => p.id !== product.id));
      setProductToDelete(null);
      toast({
        title: 'Produto excluído',
        description: 'O produto foi removido (inativado) com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      const message = error instanceof Error ? error.message : String(error);
      // Tenta extrair corpo JSON retornado pela API (incluído na mensagem pelo apiCall)
      let serverMsg: string | undefined;
      try {
        const jsonStart = message.lastIndexOf('{');
        if (jsonStart !== -1) {
          const jsonText = message.substring(jsonStart);
          const parsed = JSON.parse(jsonText);
          serverMsg = parsed?.message || parsed?.error;
        }
      } catch {}

      const isConflict = message.includes('409') || message.toLowerCase().includes('conflict');
      toast({
        title: isConflict ? 'Não foi possível excluir' : 'Erro ao excluir produto',
        description: serverMsg || 'Ocorreu um erro inesperado ao excluir o produto.',
        variant: 'destructive',
      });
    }
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
        
        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(value: any) => setFilters({ status: value })}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {/* Categorias */}
        {allCategories.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" /> Categorias
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-background" align="start">
              <div className="space-y-2">
                {allCategories.map((cat) => {
                  const checked = filters.category.includes(cat);
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${cat}`}
                        checked={checked}
                        onCheckedChange={(v) => {
                          const isChecked = Boolean(v);
                          const next = isChecked
                            ? [...filters.category, cat]
                            : filters.category.filter((c) => c !== cat);
                          setFilters({ category: next });
                        }}
                      />
                      <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                        {cat}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Com imagem */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="with-image"
            checked={filters.withImage}
            onCheckedChange={(v) => setFilters({ withImage: Boolean(v) })}
          />
          <Label htmlFor="with-image" className="text-sm cursor-pointer">
            Com imagem
          </Label>
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

      {/* Chips de categorias ativas */}
      {filters.category.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1">
              {cat}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ category: filters.category.filter((c) => c !== cat) })}
              />
            </Badge>
          ))}
        </div>
      )}

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
                      {product.category || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {formatCurrencyDot(product.price)}
                  </TableCell>
                  <TableCell>
                    <span className={product.currentStock < 10 ? 'text-destructive font-semibold' : ''}>
                      {product.currentStock}
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
                          <Link
                            to={`/erp/produtos/${product.id}/editar`}
                            onClick={() => {
                              console.info('[Produtos] Clique em Editar', { id: product.id, name: product.name });
                            }}
                          >
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
