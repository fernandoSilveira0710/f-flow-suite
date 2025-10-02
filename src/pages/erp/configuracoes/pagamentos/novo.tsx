import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/erp/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { createPaymentMethod, PaymentMethodType } from '@/lib/payments-api';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['CASH', 'DEBIT', 'CREDIT', 'PIX', 'VOUCHER', 'OTHER']),
  ativo: z.boolean(),
  ordem: z.number().min(1),
  permiteTroco: z.boolean(),
  permiteParcelas: z.boolean(),
  maxParcelas: z.number().min(1).max(12).optional(),
  jurosPorParcelaPct: z.number().min(0).max(100).optional(),
  descontoFixoPct: z.number().min(0).max(100).optional(),
  taxaFixa: z.number().min(0).optional(),
  integracaoProvider: z.enum(['nenhum', 'maquininha', 'gateway']).optional(),
  referenciaExterna: z.string().optional(),
  imprimeComprovante: z.boolean(),
  contabilizaNoCaixa: z.boolean(),
  permiteSangria: z.boolean(),
  valorMin: z.number().min(0).optional(),
  valorMax: z.number().min(0).optional(),
  somenteSeCaixaAberto: z.boolean(),
  mostrarNoPDV: z.boolean(),
}).refine((data) => {
  if (data.valorMin !== undefined && data.valorMax !== undefined) {
    return data.valorMin <= data.valorMax;
  }
  return true;
}, {
  message: 'Valor mínimo deve ser menor que o máximo',
  path: ['valorMax'],
});

type FormData = z.infer<typeof formSchema>;

export default function NovoPagamento() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testValue, setTestValue] = useState('100.00');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      tipo: 'CASH',
      ativo: true,
      ordem: 1,
      permiteTroco: false,
      permiteParcelas: false,
      maxParcelas: 1,
      jurosPorParcelaPct: 0,
      descontoFixoPct: 0,
      taxaFixa: 0,
      integracaoProvider: 'nenhum',
      referenciaExterna: '',
      imprimeComprovante: false,
      contabilizaNoCaixa: false,
      permiteSangria: false,
      valorMin: undefined,
      valorMax: undefined,
      somenteSeCaixaAberto: true,
      mostrarNoPDV: true,
    },
  });

  const watchTipo = form.watch('tipo');
  const watchPermiteParcelas = form.watch('permiteParcelas');
  const watchDescontoFixoPct = form.watch('descontoFixoPct');
  const watchJurosPorParcelaPct = form.watch('jurosPorParcelaPct');
  const watchMaxParcelas = form.watch('maxParcelas');
  const watchTaxaFixa = form.watch('taxaFixa');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createPaymentMethod({
        nome: data.nome,
        tipo: data.tipo as PaymentMethodType,
        ativo: data.ativo,
        ordem: data.ordem,
        permiteTroco: data.permiteTroco,
        permiteParcelas: data.permiteParcelas,
        maxParcelas: data.permiteParcelas ? data.maxParcelas : undefined,
        jurosPorParcelaPct: data.permiteParcelas ? data.jurosPorParcelaPct : undefined,
        descontoFixoPct: data.descontoFixoPct,
        taxaFixa: data.taxaFixa,
        integracao: {
          provider: data.integracaoProvider,
          referenciaExterna: data.referenciaExterna,
          imprimeComprovante: data.imprimeComprovante,
        },
        regrasCaixa: {
          contabilizaNoCaixa: data.contabilizaNoCaixa,
          permiteSangria: data.permiteSangria,
        },
        restricoes: {
          valorMin: data.valorMin,
          valorMax: data.valorMax,
          somenteSeCaixaAberto: data.somenteSeCaixaAberto,
        },
        visibilidade: {
          mostrarNoPDV: data.mostrarNoPDV,
        },
      });

      toast.success('Método de pagamento criado com sucesso');
      navigate('/erp/configuracoes/pagamentos');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar método');
    } finally {
      setLoading(false);
    }
  };

  const calculateTest = () => {
    const value = parseFloat(testValue);
    if (isNaN(value)) return null;

    let desconto = 0;
    let juros = 0;
    const taxa = watchTaxaFixa || 0;

    if (watchDescontoFixoPct && watchDescontoFixoPct > 0) {
      desconto = value * (watchDescontoFixoPct / 100);
    }

    if (watchPermiteParcelas && watchMaxParcelas && watchMaxParcelas > 1 && watchJurosPorParcelaPct && watchJurosPorParcelaPct > 0) {
      juros = value * (watchJurosPorParcelaPct / 100) * (watchMaxParcelas - 1);
    }

    const total = value - desconto + juros + taxa;

    return { value, desconto, juros, taxa, total };
  };

  const testResult = calculateTest();

  return (
    <div>
      <PageHeader
        title="Novo Método de Pagamento"
        description="Configure um novo meio de pagamento para o PDV"
      />

      <Button
        variant="ghost"
        onClick={() => navigate('/erp/configuracoes/pagamentos')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
          {/* Básico */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: PIX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">Dinheiro</SelectItem>
                          <SelectItem value="DEBIT">Débito</SelectItem>
                          <SelectItem value="CREDIT">Crédito</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="VOUCHER">Vale</SelectItem>
                          <SelectItem value="OTHER">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Posição no PDV</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Método Ativo</FormLabel>
                        <FormDescription>Disponível para uso</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mostrarNoPDV"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Mostrar no PDV</FormLabel>
                        <FormDescription>Visível na tela de venda</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Regras de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Regras de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="permiteTroco"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <FormLabel>Permite Troco</FormLabel>
                      <FormDescription>Cliente pode receber troco (típico de dinheiro)</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={watchTipo !== 'CASH'}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permiteParcelas"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <FormLabel>Permite Parcelas</FormLabel>
                      <FormDescription>Habilitar parcelamento</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchPermiteParcelas && (
                <div className="grid md:grid-cols-2 gap-4 pl-4">
                  <FormField
                    control={form.control}
                    name="maxParcelas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de Parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jurosPorParcelaPct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juros por Parcela (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Ex: 1.99% a.m.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="descontoFixoPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto Fixo (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Ex: PIX com -1.5%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxaFixa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Fixa (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Custo por transação</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mínimo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Máximo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Integração */}
          <Card>
            <CardHeader>
              <CardTitle>Integração (Mock)</CardTitle>
              <CardDescription>Configurações de integração com sistemas externos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="integracaoProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="nenhum">Nenhum</SelectItem>
                          <SelectItem value="maquininha">Maquininha</SelectItem>
                          <SelectItem value="gateway">Gateway</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenciaExterna"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referência Externa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ID da conta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imprimeComprovante"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <FormLabel>Imprime Comprovante</FormLabel>
                      <FormDescription>Gerar comprovante automaticamente</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Regras de Caixa */}
          <Card>
            <CardHeader>
              <CardTitle>Regras de Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contabilizaNoCaixa"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <FormLabel>Contabiliza no Caixa</FormLabel>
                      <FormDescription>Entra no fechamento como dinheiro em caixa</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permiteSangria"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <FormLabel>Permite Sangria</FormLabel>
                      <FormDescription>Habilitar retiradas de caixa</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={watchTipo !== 'CASH'}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="somenteSeCaixaAberto"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <FormLabel>Somente se Caixa Aberto</FormLabel>
                      <FormDescription>Exigir caixa aberto para usar este método</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Teste Rápido */}
          <Card>
            <CardHeader>
              <CardTitle>Teste Rápido</CardTitle>
              <CardDescription>Simule o cálculo com um valor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder="100.00"
                  className="max-w-xs"
                />
              </div>

              {testResult && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor:</span>
                    <span className="font-medium">R$ {testResult.value.toFixed(2)}</span>
                  </div>
                  {testResult.desconto > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto:</span>
                      <span className="font-medium">- R$ {testResult.desconto.toFixed(2)}</span>
                    </div>
                  )}
                  {testResult.juros > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Juros:</span>
                      <span className="font-medium">+ R$ {testResult.juros.toFixed(2)}</span>
                    </div>
                  )}
                  {testResult.taxa > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Taxa:</span>
                      <span className="font-medium">+ R$ {testResult.taxa.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">R$ {testResult.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              <DollarSign className="mr-2 h-4 w-4" />
              Criar Método
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/erp/configuracoes/pagamentos')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
