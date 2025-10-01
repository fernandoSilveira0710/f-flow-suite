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
import StubPage from "./pages/erp/stub-page";

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

          {/* Stub Pages */}
          <Route path="pdv" element={<StubPage title="PDV" description="Ponto de Venda" />} />
          <Route path="estoque" element={<StubPage title="Estoque" description="Controle de Estoque" />} />
          <Route path="agenda" element={<StubPage title="Agenda" description="Agendamento de Serviços" />} />
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
