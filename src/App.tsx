import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { persistQueryCache, restoreQueryCache } from "@/lib/queryPersistence";
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
import InventoryMovementsPage from "./pages/InventoryMovementsPage";
import CurrencySettingsPage from "./pages/CurrencySettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 60 * 24, // 24h
      retry: (failureCount, error: any) => {
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Restore cache on startup
restoreQueryCache(queryClient);

const App = () => {
  useEffect(() => {
    const cleanup = persistQueryCache(queryClient);
    
    // Re-fetch all when sync completes
    const handleSyncComplete = () => {
      queryClient.invalidateQueries();
    };
    window.addEventListener("offline-sync-complete", handleSyncComplete);
    
    return () => {
      cleanup();
      window.removeEventListener("offline-sync-complete", handleSyncComplete);
    };
  }, []);

  return (
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
              <Route path="/movimientos-inventario" element={<ProtectedRoute><InventoryMovementsPage /></ProtectedRoute>} />
              <Route path="/auditoria" element={<ProtectedRoute requireAdmin><AuditPage /></ProtectedRoute>} />
              <Route path="/moneda" element={<ProtectedRoute requireAdmin><CurrencySettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
