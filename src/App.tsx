import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Site pages
import Home from "./pages/site/home";
import Planos from "./pages/site/planos";
import Contato from "./pages/site/contato";
import Login from "./pages/site/login";
import Cadastro from "./pages/site/cadastro";

// ERP Layout & Pages
import ErpLayout from "./layouts/erp-layout";
import Dashboard from "./pages/erp/dashboard";
import ProdutosIndex from "./pages/erp/produtos/index";
import ProdutosNovo from "./pages/erp/produtos/novo";
import ProdutoDetalhe from "./pages/erp/produtos/[id]";
import ProdutoEditar from "./pages/erp/produtos/[id]/editar";
import PdvIndex from "./pages/erp/pdv/index";
import PdvSession from "./pages/erp/pdv/session";
import PdvCheckout from "./pages/erp/pdv/checkout";
import PdvHistory from "./pages/erp/pdv/history";
import StubPage from "./pages/erp/stub-page";
import VendasIndex from './pages/erp/vendas/index';
import ServicosIndex from './pages/erp/agenda/servicos/index';
import NovoServico from './pages/erp/agenda/servicos/novo';
import EditarServico from './pages/erp/agenda/servicos/[id]/editar';

// Stock pages
import StockPosition from "./pages/erp/estoque/index";
import StockMovements from "./pages/erp/estoque/movimentacoes";
import StockSuppliers from "./pages/erp/estoque/fornecedores";
import StockAlerts from "./pages/erp/estoque/alertas";
import StockSettings from "./pages/erp/estoque/preferencias";
import StockLabels from "./pages/erp/estoque/etiquetas";

// Settings Layout & Pages
import SettingsLayout from "./layouts/settings-layout";
import OrganizacaoPage from "./pages/erp/configuracoes/organizacao";
import BrandingPage from "./pages/erp/configuracoes/branding";
import UsuariosPage from "./pages/erp/configuracoes/usuarios";
import PapeisPage from "./pages/erp/configuracoes/papeis";
import PlanoPage from "./pages/erp/configuracoes/plano";
import LicencasPage from "./pages/erp/configuracoes/licencas";
import ApiKeysPage from "./pages/erp/configuracoes/api";
import WebhooksPage from "./pages/erp/configuracoes/webhooks";
import PreferenciasPage from "./pages/erp/configuracoes/preferencias";
import NotificacoesPage from "./pages/erp/configuracoes/notificacoes";
import AuditoriaPage from "./pages/erp/configuracoes/auditoria";
import ImportarExportarPage from "./pages/erp/configuracoes/importar-exportar";
import DangerPage from "./pages/erp/configuracoes/danger";
import PagamentosSettings from "./pages/erp/configuracoes/pagamentos";
import NovoPagamento from "./pages/erp/configuracoes/pagamentos/novo";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Site Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* ERP Routes */}
          <Route path="/erp" element={<ErpLayout />}>
            <Route index element={<Navigate to="/erp/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Produtos */}
            <Route path="produtos" element={<ProdutosIndex />} />
            <Route path="produtos/novo" element={<ProdutosNovo />} />
            <Route path="produtos/:id" element={<ProdutoDetalhe />} />
            <Route path="produtos/:id/editar" element={<ProdutoEditar />} />

          {/* PDV Routes */}
          <Route path="pdv" element={<PdvIndex />} />
          <Route path="pdv/session" element={<PdvSession />} />
          <Route path="pdv/checkout" element={<PdvCheckout />} />
          <Route path="pdv/history" element={<PdvHistory />} />
          
          {/* Vendas */}
          <Route path="vendas" element={<VendasIndex />} />
          
          {/* Stock Routes */}
          <Route path="estoque" element={<StockPosition />} />
          <Route path="estoque/movimentacoes" element={<StockMovements />} />
          <Route path="estoque/fornecedores" element={<StockSuppliers />} />
          <Route path="estoque/pedidos-compra" element={<StubPage title="Pedidos de Compra" description="Gestão de pedidos" />} />
          <Route path="estoque/pedidos-compra/novo" element={<StubPage title="Novo Pedido" description="Criar pedido de compra" />} />
          <Route path="estoque/pedidos-compra/:id" element={<StubPage title="Detalhe do Pedido" description="Visualizar pedido" />} />
          <Route path="estoque/inventarios" element={<StubPage title="Inventários" description="Contagens de estoque" />} />
          <Route path="estoque/inventarios/novo" element={<StubPage title="Novo Inventário" description="Criar inventário" />} />
          <Route path="estoque/inventarios/:id" element={<StubPage title="Detalhe do Inventário" description="Visualizar inventário" />} />
          <Route path="estoque/alertas" element={<StockAlerts />} />
          <Route path="estoque/preferencias" element={<StockSettings />} />
          <Route path="estoque/etiquetas" element={<StockLabels />} />
          
          {/* Agenda Routes */}
          <Route path="agenda" element={<StubPage title="Agenda" description="Agendamento de Serviços" />} />
          <Route path="agenda/servicos" element={<ServicosIndex />} />
          <Route path="agenda/servicos/novo" element={<NovoServico />} />
          <Route path="agenda/servicos/:id/editar" element={<EditarServico />} />
          
          <Route path="banho-tosa" element={<StubPage title="Banho & Tosa" description="Gestão de Pet Shop" />} />
          <Route path="relatorios" element={<StubPage title="Relatórios" description="Relatórios e Análises" />} />
          
          {/* Settings Routes */}
          <Route path="configuracoes" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/erp/configuracoes/organizacao" replace />} />
            <Route path="organizacao" element={<OrganizacaoPage />} />
            <Route path="branding" element={<BrandingPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="papeis" element={<PapeisPage />} />
            <Route path="plano" element={<PlanoPage />} />
            <Route path="licencas" element={<LicencasPage />} />
            <Route path="api" element={<ApiKeysPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="pdv" element={<PreferenciasPage />} />
            <Route path="agenda" element={<PreferenciasPage />} />
            <Route path="pet" element={<PreferenciasPage />} />
            <Route path="estoque" element={<PreferenciasPage />} />
            <Route path="notificacoes" element={<NotificacoesPage />} />
            <Route path="pagamentos" element={<PagamentosSettings />} />
            <Route path="pagamentos/novo" element={<NovoPagamento />} />
            <Route path="pagamentos/:id/editar" element={<NovoPagamento />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
            <Route path="importar-exportar" element={<ImportarExportarPage />} />
            <Route path="danger" element={<DangerPage />} />
          </Route>
        </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
