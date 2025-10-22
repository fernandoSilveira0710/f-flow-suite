import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/erp/page-header';
import { SettingsSection } from '@/components/settings/settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { mockAPI } from '@/lib/mock-data';
import { UnitOfMeasure } from '@/lib/mock-data';

const unitSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  abbreviation: z.string().min(1, 'Abreviação é obrigatória'),
  type: z.enum(['weight', 'volume', 'length', 'unit']),
  active: z.boolean(),
});

type UnitFormData = z.infer<typeof unitSchema>;

export default function UnitsSettings() {
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: '',
      abbreviation: '',
      type: 'unit',
      active: true,
    },
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = () => {
    const allUnits = mockAPI.getAllUnitsOfMeasure();
    setUnits(allUnits);
  };

  const onSubmit = async (data: UnitFormData) => {
    setLoading(true);
    try {
      if (editingUnit) {
        mockAPI.updateUnitOfMeasure(editingUnit.id, data);
        toast.success('Unidade de medida atualizada com sucesso');
      } else {
        mockAPI.createUnitOfMeasure(data as Omit<UnitOfMeasure, 'id'>);
        toast.success('Unidade de medida criada com sucesso');
      }
      
      loadUnits();
      setDialogOpen(false);
      form.reset();
      setEditingUnit(null);
    } catch (error) {
      toast.error('Erro ao salvar unidade de medida');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit: UnitOfMeasure) => {
    setEditingUnit(unit);
    form.reset({
      name: unit.name,
      abbreviation: unit.abbreviation,
      type: unit.type,
      active: unit.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (unitId: string) => {
    if (confirm('Tem certeza que deseja excluir esta unidade de medida?')) {
      mockAPI.deleteUnitOfMeasure(unitId);
      loadUnits();
      toast.success('Unidade de medida excluída com sucesso');
    }
  };

  const handleNewUnit = () => {
    setEditingUnit(null);
    form.reset({
      name: '',
      abbreviation: '',
      type: 'unit',
      active: true,
    });
    setDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const types = {
      weight: 'Peso',
      volume: 'Volume',
      length: 'Comprimento',
      unit: 'Unidade',
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Unidades de Medida" 
        description="Gerencie as unidades de medida disponíveis para produtos"
      />

      <SettingsSection
        title="Unidades de Medida"
        description="Configure as unidades de medida que podem ser utilizadas nos produtos"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {units.length} unidade{units.length !== 1 ? 's' : ''} cadastrada{units.length !== 1 ? 's' : ''}
            </p>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewUnit}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Unidade
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUnit ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Quilograma" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="abbreviation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Abreviação</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: kg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weight">Peso</SelectItem>
                              <SelectItem value="volume">Volume</SelectItem>
                              <SelectItem value="length">Comprimento</SelectItem>
                              <SelectItem value="unit">Unidade</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Ativo</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Unidade disponível para uso
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Salvando...' : editingUnit ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Abreviação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.abbreviation}</TableCell>
                    <TableCell>{getTypeLabel(unit.type)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        unit.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {unit.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(unit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(unit.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}