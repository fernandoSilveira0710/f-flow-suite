import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { getProducts as getProductsAPI, deleteProduct as deleteProductAPI, getProductDependencies, type ProductResponse } from '@/lib/products-api';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface ProductFilters {
  q: string;
  status: 'all' | 'active' | 'inactive';
  category: string[];
  withImage: boolean;
  expiringSoon: boolean;
  days: number;
  lowStock: boolean;
  page: number;
  pageSize: number;
}

const defaultFilters: ProductFilters = {
  q: '',
  status: 'active',
  category: [],
  withImage: false,
  expiringSoon: false,
  days: 30,
  lowStock: false,
  page: 1,
  pageSize: 20,
};

export default function ProdutosIndex() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);
  const [hardDelete, setHardDelete] = useState(false);
  const [deps, setDeps] = useState<{ blocking: { saleItems: number; stockMovements: number; inventoryAdjustments: number }; nonBlocking: { groomingItems: number }; canHardDelete: boolean } | null>(null);
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

  useEffect(() => {
    (async () => {
      if (productToDelete) {
        try {
          const d = await getProductDependencies(productToDelete.id);
          setDeps(d);
        } catch (e) {
          setDeps(null);
        }
      } else {
        setDeps(null);
      }
    })();
  }, [productToDelete]);

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

    // Low stock (estoque baixo): currentStock <= minStock (quando minStock > 0)
    if (filters.lowStock) {
      result = result.filter(p => {
        const min = typeof p.minStock === 'number' ? p.minStock : 0;
        return p.trackStock && min > 0 && p.currentStock <= min;
      });
    }

    return result;
  }, [products, filters]);

  const handleDelete = async (product: ProductResponse, opts?: { hard?: boolean }) => {
    try {
      await deleteProductAPI(product.id, { hard: opts?.hard });
      setProducts(products.filter(p => p.id !== product.id));
      setProductToDelete(null);
      setHardDelete(false);
      toast({
        title: 'Produto excluído',
        description: opts?.hard ? 'O produto foi excluído permanentemente.' : 'O produto foi removido (inativado) com sucesso.',
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
        title: isConflict ? 'Não foi possível excluir permanentemente' : 'Erro ao excluir produto',
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
          onAction={() => navigate('/erp/produtos/novo')}
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

        {/* Estoque baixo */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="low-stock"
            checked={filters.lowStock}
            onCheckedChange={(v) => setFilters({ lowStock: Boolean(v), page: 1 })}
          />
          <Label htmlFor="low-stock" className="text-sm cursor-pointer">
            Estoque baixo
          </Label>
        </div>

        {/* Itens por página */}
        <Select
          value={String(filters.pageSize)}
          onValueChange={(value: any) => setFilters({ pageSize: Number(value), page: 1 })}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Itens por página" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="20">20 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
          </SelectContent>
        </Select>

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
              (() => {
                const totalItems = filteredProducts.length;
                const pageSize = Math.max(1, filters.pageSize);
                const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
                const currentPage = Math.min(Math.max(1, filters.page), totalPages);
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageItems = filteredProducts.slice(startIndex, endIndex);

                return pageItems.map((product) => (
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
                ));
              })()
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {(() => {
              const totalItems = filteredProducts.length;
              const pageSize = Math.max(1, filters.pageSize);
              const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
              const currentPage = Math.min(Math.max(1, filters.page), totalPages);
              const start = (currentPage - 1) * pageSize + 1;
              const end = Math.min(start + pageSize - 1, totalItems);
              return `Mostrando ${start}-${end} de ${totalItems}`;
            })()}
          </div>
          {(() => {
            const totalItems = filteredProducts.length;
            const pageSize = Math.max(1, filters.pageSize);
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const currentPage = Math.min(Math.max(1, filters.page), totalPages);

            const pagesToShow = 5;
            const half = Math.floor(pagesToShow / 2);
            let startPage = Math.max(1, currentPage - half);
            let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
            if (endPage - startPage < pagesToShow - 1) {
              startPage = Math.max(1, endPage - pagesToShow + 1);
            }
            const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

            return (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (currentPage > 1) setFilters({ page: currentPage - 1 }); }}
                    />
                  </PaginationItem>
                  {startPage > 1 && (
                    <PaginationItem>
                      <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setFilters({ page: 1 }); }}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {startPage > 2 && (
                    <PaginationItem>
                      <span className="px-2">...</span>
                    </PaginationItem>
                  )}
                  {pageNumbers.map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === currentPage}
                        onClick={(e) => { e.preventDefault(); setFilters({ page: p }); }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {endPage < totalPages - 1 && (
                    <PaginationItem>
                      <span className="px-2">...</span>
                    </PaginationItem>
                  )}
                  {endPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setFilters({ page: totalPages }); }}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setFilters({ page: currentPage + 1 }); }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            );
          })()}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => { setProductToDelete(null); setHardDelete(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{productToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2">
              <Checkbox id="hard-delete" checked={hardDelete} onCheckedChange={(v) => setHardDelete(Boolean(v))} disabled={deps ? !deps.canHardDelete : false} />
              <Label htmlFor="hard-delete" className="font-normal">Excluir permanentemente</Label>
            </div>
            {deps && (
              <div className="text-sm text-muted-foreground">
                {deps.canHardDelete ? (
                  <span>Sem vínculos bloqueantes. A exclusão permanente está disponível.</span>
                ) : (
                  <div>
                    <div className="font-medium text-destructive">Não é possível excluir permanentemente:</div>
                    <ul className="list-disc pl-5">
                      {deps.blocking.saleItems > 0 && <li>{deps.blocking.saleItems} registro(s) em vendas</li>}
                      {deps.blocking.stockMovements > 0 && <li>{deps.blocking.stockMovements} movimentação(ões) de estoque</li>}
                      {deps.blocking.inventoryAdjustments > 0 && <li>{deps.blocking.inventoryAdjustments} ajuste(s) de inventário</li>}
                    </ul>
                    <div className="mt-1">Inative o produto ou remova estes vínculos para prosseguir.</div>
                  </div>
                )}
                {deps.nonBlocking.groomingItems > 0 && (
                  <div className="mt-2">Observação: {deps.nonBlocking.groomingItems} vínculo(s) em serviços de grooming não impedem a exclusão (serão desvinculados).</div>
                )}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && handleDelete(productToDelete, { hard: hardDelete })}
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
