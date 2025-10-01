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
import { StubPage } from "./pages/erp/stub-page";

// Icons
import { ShoppingCart, Warehouse, Calendar, Scissors, BarChart3, Settings } from "lucide-react";

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
            <Route 
              path="pdv" 
              element={
                <StubPage 
                  title="PDV" 
                  description="Ponto de Venda"
                  icon={ShoppingCart}
                />
              } 
            />
            <Route 
              path="estoque" 
              element={
                <StubPage 
                  title="Estoque" 
                  description="Controle de Estoque"
                  icon={Warehouse}
                />
              } 
            />
            <Route 
              path="agenda" 
              element={
                <StubPage 
                  title="Agenda" 
                  description="Agendamento de Serviços"
                  icon={Calendar}
                />
              } 
            />
            <Route 
              path="banho-tosa" 
              element={
                <StubPage 
                  title="Banho & Tosa" 
                  description="Gestão de Pet Shop"
                  icon={Scissors}
                />
              } 
            />
            <Route 
              path="relatorios" 
              element={
                <StubPage 
                  title="Relatórios" 
                  description="Relatórios e Análises"
                  icon={BarChart3}
                />
              } 
            />
            <Route 
              path="configuracoes" 
              element={
                <StubPage 
                  title="Configurações" 
                  description="Configurações do Sistema"
                  icon={Settings}
                />
              } 
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
