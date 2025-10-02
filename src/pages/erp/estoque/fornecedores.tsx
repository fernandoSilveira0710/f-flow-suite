import { useState } from 'react';
import { Plus, Edit, Archive, ArchiveRestore } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  toggleSupplierStatus,
  type Supplier,
} from '@/lib/stock-api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const supplierSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpjCpf: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(getSuppliers());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      nome: '',
      cnpjCpf: '',
      email: '',
      telefone: '',
      cidade: '',
      uf: '',
      cep: '',
    },
  });

  const openDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.reset({
        nome: supplier.nome,
        cnpjCpf: supplier.cnpjCpf || '',
        email: supplier.email || '',
        telefone: supplier.telefone || '',
        cidade: supplier.endereco?.cidade || '',
        uf: supplier.endereco?.uf || '',
        cep: supplier.endereco?.cep || '',
      });
    } else {
      setEditingSupplier(null);
      form.reset({
        nome: '',
        cnpjCpf: '',
        email: '',
        telefone: '',
        cidade: '',
        uf: '',
        cep: '',
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = (data: SupplierFormData) => {
    try {
      if (editingSupplier) {
        updateSupplier(editingSupplier.id, {
          nome: data.nome,
          cnpjCpf: data.cnpjCpf,
          email: data.email,
          telefone: data.telefone,
          endereco: {
            cidade: data.cidade,
            uf: data.uf,
            cep: data.cep,
          },
        });
        toast({ title: 'Fornecedor atualizado com sucesso' });
      } else {
        createSupplier({
          nome: data.nome,
          cnpjCpf: data.cnpjCpf,
          email: data.email,
          telefone: data.telefone,
          endereco: {
            cidade: data.cidade,
            uf: data.uf,
            cep: data.cep,
          },
          ativo: true,
        });
        toast({ title: 'Fornecedor criado com sucesso' });
      }

      setSuppliers(getSuppliers());
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar fornecedor',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleSupplierStatus(id);
    setSuppliers(getSuppliers());
    toast({ title: 'Status atualizado' });
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Gestão de fornecedores"
        actionLabel="Novo Fornecedor"
        actionIcon={Plus}
        onAction={() => openDialog()}
      />

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Suppliers table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ/CPF</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.nome}</TableCell>
                  <TableCell>{supplier.cnpjCpf || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.telefone || '-'}</TableCell>
                  <TableCell>
                    {supplier.endereco?.cidade && supplier.endereco?.uf
                      ? `${supplier.endereco.cidade}/${supplier.endereco.uf}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {supplier.ativo ? (
                      <Badge className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openDialog(supplier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(supplier.id)}
                      >
                        {supplier.ativo ? (
                          <Archive className="h-4 w-4" />
                        ) : (
                          <ArchiveRestore className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/erp/estoque/pedidos-compra/novo?fornecedorId=${supplier.id}`)
                        }
                      >
                        Criar Pedido
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnpjCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ/CPF</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
