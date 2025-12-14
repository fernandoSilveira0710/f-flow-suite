import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import RequirePermission from "@/components/auth/require-permission";

// Site pages desabilitados no build dev para evitar erros

// ERP Layout & Pages
import ErpLayout from "./layouts/erp-layout";
import ErpLogin from "./pages/erp/login";
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
import ProfissionaisIndex from './pages/erp/agenda/profissionais/index';
import NovoProfissional from './pages/erp/agenda/profissionais/novo';
import EditarProfissional from './pages/erp/agenda/profissionais/[id]/editar';
import ClientesIndex from './pages/erp/agenda/clientes/index';
import NovoCliente from './pages/erp/agenda/clientes/novo';
import EditarCliente from './pages/erp/agenda/clientes/[id]/editar';

// New Customer & Pet pages
import ClientesIndexNew from './pages/erp/clientes/index';
import NovoClienteNew from './pages/erp/clientes/novo';
import EditarClienteNew from './pages/erp/clientes/[id]';
import GerenciarPetsCliente from './pages/erp/clientes/[id]/pets/index';
import NovoPetCliente from './pages/erp/clientes/[id]/pets/novo';
import EditarPetCliente from './pages/erp/clientes/[id]/pets/[petId]';
import AgendaIndex from './pages/erp/agenda/index';
import NovoAgendamento from './pages/erp/agenda/novo';
import AgendamentoDetalhe from './pages/erp/agenda/[id]';
import GroomingIndex from './pages/erp/grooming/index';
import GroomingCheckIn from './pages/erp/grooming/new';
import GroomingServicesIndex from './pages/erp/grooming/services/index';
import NovoGroomingService from './pages/erp/grooming/services/novo';
import EditarGroomingService from './pages/erp/grooming/services/[id]/editar';
import GroomingPetsIndex from './pages/erp/grooming/pets/index';
import NovoPet from './pages/erp/grooming/pets/novo';
import EditarPet from './pages/erp/grooming/pets/[id]/editar';
import GroomingResourcesIndex from './pages/erp/grooming/resources/index';
import NovoRecurso from './pages/erp/grooming/resources/novo';
import EditarRecurso from './pages/erp/grooming/resources/[id]/editar';
import TutorsIndex from './pages/erp/grooming/tutors/index';
import NovoTutor from './pages/erp/grooming/tutors/novo';
import GroomingProfissionaisIndex from './pages/erp/grooming/profissionais/index';
import NovoGroomingProfissional from './pages/erp/grooming/profissionais/novo';
import EditarGroomingProfissional from './pages/erp/grooming/profissionais/[id]/editar';
import GroomingCategoriesIndex from './pages/erp/grooming/categories/index';
import GroomingTicketDetails from './pages/erp/grooming/details';

// Stock pages
import StockPosition from "./pages/erp/estoque/index";
import StockMovements from "./pages/erp/estoque/movimentacoes";
import StockSuppliers from "./pages/erp/estoque/fornecedores";
import StockAlerts from "./pages/erp/estoque/alertas";
import StockSettings from "./pages/erp/estoque/preferencias";
import StockLabels from "./pages/erp/estoque/etiquetas";

// Settings Layout & Pages
import SettingsLayout from "./layouts/settings-layout";
import SettingsIndexRedirect from "./pages/erp/settings/index-redirect";
import OrganizacaoPage from "./pages/erp/configuracoes/organizacao";
import UsuariosPage from "./pages/erp/configuracoes/usuarios";
import PapeisPage from "./pages/erp/configuracoes/papeis";
import PlanoPage from "./pages/erp/configuracoes/plano";
import LicencasPage from "./pages/erp/configuracoes/licencas";
import RelatoriosAuditoriaPage from "./pages/erp/relatorios/auditoria";
import RelatoriosHomePage from "./pages/erp/relatorios";
import TrocarContaPage from "./pages/erp/configuracoes/trocar-conta";
// Settings pages inexistentes removidos do build
import NovoPagamento from "./pages/erp/configuracoes/pagamentos/novo";
import PaymentsIndex from "./pages/erp/configuracoes/pagamentos/index";
import NovaUnidade from "./pages/erp/configuracoes/unidades/novo";
import UnitsIndex from "./pages/erp/configuracoes/unidades/index";
import NovaCategoria from "./pages/erp/configuracoes/categorias/novo";
import CategoriesIndex from "./pages/erp/configuracoes/categorias/index";
import ConfiguracoesRedirect from "./pages/erp/configuracoes/index";
import ConfiguracoesAlias from "./pages/erp/configuracoes/[...alias]";
import ImportarExportarPage from "./pages/erp/configuracoes/importar-exportar";

// Fallback simples inline para 404
const SimpleNotFound = () => (
  <div style={{ padding: 24 }}>
    <h2>404</h2>
    <p>Página não encontrada.</p>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Site Routes removidas; manter apenas redirect */}
              <Route path="/" element={<Navigate to="/erp/login" replace />} />

              {/* ERP Login (Public) */}
              <Route path="/erp/login" element={<ErpLogin />} />

              {/* Protected ERP Routes */}
              <Route path="/erp" element={
                <ProtectedRoute requireAuth={true} requireLicense={true}>
                  <ErpLayout />
                </ProtectedRoute>
              }>
            <Route index element={<Navigate to="/erp/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Produtos */}
            <Route path="produtos" element={<RequirePermission permission="products:read"><ProdutosIndex /></RequirePermission>} />
            <Route path="produtos/novo" element={<RequirePermission permission="products:write"><ProdutosNovo /></RequirePermission>} />
            <Route path="produtos/:id" element={<RequirePermission permission="products:read"><ProdutoDetalhe /></RequirePermission>} />
            <Route path="produtos/:id/editar" element={<RequirePermission permission="products:write"><ProdutoEditar /></RequirePermission>} />

          {/* PDV Routes */}
          <Route path="pdv" element={<RequirePermission permission="pos:read"><PdvIndex /></RequirePermission>} />
          <Route path="pdv/session" element={<RequirePermission permission="pos:read"><PdvSession /></RequirePermission>} />
          <Route path="pdv/checkout" element={<RequirePermission permission="pos:checkout"><PdvCheckout /></RequirePermission>} />
          <Route path="pdv/history" element={<RequirePermission permission="pos:read"><PdvHistory /></RequirePermission>} />
          
          {/* Vendas */}
          <Route path="vendas" element={<RequirePermission permission="sales:read"><VendasIndex /></RequirePermission>} />
          
          {/* Stock Routes */}
          <Route path="estoque" element={<RequirePermission permission="stock:read"><StockPosition /></RequirePermission>} />
          <Route path="estoque/movimentacoes" element={<RequirePermission permission="stock:read"><StockMovements /></RequirePermission>} />
          <Route path="estoque/fornecedores" element={<RequirePermission permission="stock:read"><StockSuppliers /></RequirePermission>} />
          <Route path="estoque/pedidos-compra" element={<StubPage title="Pedidos de Compra" description="Gestão de pedidos" />} />
          <Route path="estoque/pedidos-compra/novo" element={<StubPage title="Novo Pedido" description="Criar pedido de compra" />} />
          <Route path="estoque/pedidos-compra/:id" element={<StubPage title="Detalhe do Pedido" description="Visualizar pedido" />} />
          <Route path="estoque/inventarios" element={<StubPage title="Inventários" description="Contagens de estoque" />} />
          <Route path="estoque/inventarios/novo" element={<StubPage title="Novo Inventário" description="Criar inventário" />} />
          <Route path="estoque/inventarios/:id" element={<StubPage title="Detalhe do Inventário" description="Visualizar inventário" />} />
          <Route path="estoque/alertas" element={<StockAlerts />} />
          <Route path="estoque/preferencias" element={<StockSettings />} />
          <Route path="estoque/etiquetas" element={<StockLabels />} />
          
          {/* Agenda - bloqueada */}
          <Route path="agenda/*" element={<Navigate to="/erp/dashboard" replace />} />
          
          {/* New Customers Routes */}
          <Route path="clientes" element={<ClientesIndexNew />} />
          <Route path="clientes/novo" element={<NovoClienteNew />} />
          <Route path="clientes/:id" element={<EditarClienteNew />} />
          <Route path="clientes/:id/pets" element={<GerenciarPetsCliente />} />
          <Route path="clientes/:id/pets/novo" element={<NovoPetCliente />} />
          <Route path="clientes/:id/pets/:petId" element={<EditarPetCliente />} />
          
          {/* Grooming - bloqueado */}
          <Route path="grooming/*" element={<Navigate to="/erp/dashboard" replace />} />
          {/* Banho & Tosa (alias) - bloqueado */}
          <Route path="banho-tosa" element={<Navigate to="/erp/dashboard" replace />} />
          
          {/* Agenda - bloqueada */}
          {/* ... existing code ... */}
          {/* Remover rotas específicas de Agenda */}
          {/* (rotas como agenda/novo, agenda/:id, agenda/servicos, profissionais, clientes foram removidas) */}
          <Route path="agenda/servicos/novo" element={<NovoServico />} />
          <Route path="agenda/servicos/:id/editar" element={<EditarServico />} />
          <Route path="agenda/profissionais" element={<ProfissionaisIndex />} />
          <Route path="agenda/profissionais/novo" element={<NovoProfissional />} />
          <Route path="agenda/profissionais/:id/editar" element={<EditarProfissional />} />
          <Route path="agenda/clientes" element={<ClientesIndex />} />
          <Route path="agenda/clientes/novo" element={<NovoCliente />} />
          <Route path="agenda/clientes/:id/editar" element={<EditarCliente />} />
          
          {/* New Customers Routes */}
          <Route path="clientes" element={<ClientesIndexNew />} />
          <Route path="clientes/novo" element={<NovoClienteNew />} />
          <Route path="clientes/:id" element={<EditarClienteNew />} />
          <Route path="clientes/:id/pets" element={<GerenciarPetsCliente />} />
          <Route path="clientes/:id/pets/novo" element={<NovoPetCliente />} />
          <Route path="clientes/:id/pets/:petId" element={<EditarPetCliente />} />
          
          {/* Grooming Routes */}
          <Route path="grooming" element={<GroomingIndex />} />
          <Route path="grooming/:id" element={<GroomingTicketDetails />} />
          <Route path="grooming/new" element={<GroomingCheckIn />} />
          <Route path="grooming/services" element={<GroomingServicesIndex />} />
          <Route path="grooming/services/novo" element={<NovoGroomingService />} />
          <Route path="grooming/services/:id/editar" element={<EditarGroomingService />} />
          <Route path="grooming/pets" element={<GroomingPetsIndex />} />
          <Route path="grooming/pets/novo" element={<NovoPet />} />
          <Route path="grooming/pets/:id/editar" element={<EditarPet />} />
          <Route path="grooming/resources" element={<GroomingResourcesIndex />} />
          <Route path="grooming/resources/novo" element={<NovoRecurso />} />
          <Route path="grooming/resources/:id/editar" element={<EditarRecurso />} />
          <Route path="grooming/tutors" element={<TutorsIndex />} />
          <Route path="grooming/tutors/novo" element={<NovoTutor />} />
          <Route path="grooming/profissionais" element={<GroomingProfissionaisIndex />} />
          <Route path="grooming/profissionais/novo" element={<NovoGroomingProfissional />} />
          <Route path="grooming/profissionais/:id/editar" element={<EditarGroomingProfissional />} />
          <Route path="grooming/categories" element={<GroomingCategoriesIndex />} />
          
          {/* Remover rotas específicas de Grooming */}
          {/* (rotas como grooming, grooming/:id, grooming/new, services, pets, resources, tutors, profissionais, categories foram removidas) */}
          <Route path="grooming/services/novo" element={<NovoGroomingService />} />
          <Route path="grooming/services/:id/editar" element={<EditarGroomingService />} />
          <Route path="grooming/pets" element={<GroomingPetsIndex />} />
          <Route path="grooming/pets/novo" element={<NovoPet />} />
          <Route path="grooming/pets/:id/editar" element={<EditarPet />} />
          <Route path="grooming/resources" element={<GroomingResourcesIndex />} />
          <Route path="grooming/resources/novo" element={<NovoRecurso />} />
          <Route path="grooming/resources/:id/editar" element={<EditarRecurso />} />
          <Route path="grooming/tutors" element={<TutorsIndex />} />
          <Route path="grooming/tutors/novo" element={<NovoTutor />} />
          <Route path="grooming/profissionais" element={<GroomingProfissionaisIndex />} />
          <Route path="grooming/profissionais/novo" element={<NovoGroomingProfissional />} />
          <Route path="grooming/profissionais/:id/editar" element={<EditarGroomingProfissional />} />
          <Route path="grooming/categories" element={<GroomingCategoriesIndex />} />
          
          {/* Agenda - bloqueada */}
          <Route path="agenda/*" element={<Navigate to="/erp/dashboard" replace />} />
          
          {/* Banho & Tosa (alias e grooming) - bloqueadas */}
          <Route path="banho-tosa" element={<Navigate to="/erp/dashboard" replace />} />
          <Route path="grooming/*" element={<Navigate to="/erp/dashboard" replace />} />
          
          {/* Relatórios */}
          <Route path="relatorios" element={<RequirePermission permission="reports:read"><RelatoriosHomePage /></RequirePermission>} />
          <Route path="relatorios/auditoria" element={<RequirePermission permission="reports:read"><RelatoriosAuditoriaPage /></RequirePermission>} />

          {/* Fallback interno do ERP */}
          <Route path="*" element={<SimpleNotFound />} />
          
              {/* Settings Routes (EN - canonical) */}
                <Route path="settings" element={<SettingsLayout />}>
                  <Route index element={<SettingsIndexRedirect />} />
                  <Route path="organization" element={<RequirePermission permission="settings:organization"><OrganizacaoPage /></RequirePermission>} />
                  <Route path="users" element={<RequirePermission permission="settings:users"><UsuariosPage /></RequirePermission>} />
                  <Route path="roles" element={<RequirePermission permission="settings:roles"><PapeisPage /></RequirePermission>} />
                  <Route path="switch-account" element={<TrocarContaPage />} />
                  <Route path="billing" element={<RequirePermission permission="settings:billing"><PlanoPage /></RequirePermission>} />
                  <Route path="licenses" element={<RequirePermission permission="settings:licenses"><LicencasPage /></RequirePermission>} />
                  {/* Payments index */}
                  <Route path="payments" element={<RequirePermission permission="settings:payments"><PaymentsIndex /></RequirePermission>} />
                  <Route path="payments/new" element={<RequirePermission permission="settings:payments"><NovoPagamento /></RequirePermission>} />
                  <Route path="payments/:id/edit" element={<RequirePermission permission="settings:payments"><NovoPagamento /></RequirePermission>} />
                  {/* Units of Measure */}
                  <Route path="units" element={<RequirePermission permission="settings:units"><UnitsIndex /></RequirePermission>} />
                  <Route path="units/new" element={<RequirePermission permission="settings:units"><NovaUnidade /></RequirePermission>} />
                  <Route path="units/:id/edit" element={<RequirePermission permission="settings:units"><NovaUnidade /></RequirePermission>} />

                  {/* Categories */}
                  <Route path="categories" element={<RequirePermission permission="settings:categories"><CategoriesIndex /></RequirePermission>} />
                  <Route path="categories/new" element={<RequirePermission permission="settings:categories"><NovaCategoria /></RequirePermission>} />
                  <Route path="categories/:id/edit" element={<RequirePermission permission="settings:categories"><NovaCategoria /></RequirePermission>} />
                  {/* Import/Export */}
                  <Route path="import-export" element={<RequirePermission permission="settings:import-export"><ImportarExportarPage /></RequirePermission>} />
            {/* Products (Settings) - removido */}
                  <Route path="notifications" element={<Navigate to="/erp/settings/organization" replace />} />
                </Route>

              {/* PT-BR Aliases (redirect to EN canonical) */}
              <Route path="configuracoes" element={<ConfiguracoesRedirect />} />
              <Route path="configuracoes/*" element={<ConfiguracoesAlias />} />
            </Route>

              {/* 404 */}
              <Route path="*" element={<SimpleNotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
