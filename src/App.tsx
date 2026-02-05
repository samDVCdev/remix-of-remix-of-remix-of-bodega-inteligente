import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import POSPage from "./pages/POSPage";
import ReportsPage from "./pages/ReportsPage";
import AccountsReceivablePage from "./pages/AccountsReceivablePage";
import UsersPage from "./pages/UsersPage";
import AuditPage from "./pages/AuditPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute requireAdmin><Index /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
              <Route path="/productos" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
              <Route path="/ventas" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
              <Route path="/salidas" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
              <Route path="/cuentas-por-cobrar" element={<ProtectedRoute><AccountsReceivablePage /></ProtectedRoute>} />
              <Route path="/reportes" element={<ProtectedRoute requireAdmin><ReportsPage /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
              <Route path="/auditoria" element={<ProtectedRoute requireAdmin><AuditPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
