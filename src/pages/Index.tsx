import { useState } from "react";
import { Package, DollarSign, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { TopDebtors } from "@/components/dashboard/TopDebtors";
import { ProductsTable } from "@/components/dashboard/ProductsTable";
import { MultiSaleDialog } from "@/components/sales/MultiSaleDialog";
import { CurrencyToggle } from "@/components/layout/CurrencyToggle";
import { BusinessStatusToggle } from "@/components/business/BusinessStatusToggle";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useProducts } from "@/hooks/useProducts";
import { useDebtorsSummary } from "@/hooks/useAccountsReceivable";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: debtors } = useDebtorsSummary();
  const { formatPrice } = useCurrency();
  const [isSaleOpen, setIsSaleOpen] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Resumen del inventario de tu bodega</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <CurrencyToggle />
            </div>
            <Button onClick={() => setIsSaleOpen(true)} className="gap-2 flex-1 sm:flex-none">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Registrar Venta</span>
              <span className="sm:hidden">Venta</span>
            </Button>
          </div>
        </div>

        {/* Business Status Control */}
        <BusinessStatusToggle />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Productos"
            value={isLoading ? "..." : stats?.totalProducts || 0}
            icon={Package}
            variant="default"
          />
          <StatCard
            title="Valor Inventario"
            value={isLoading ? "..." : formatPrice(stats?.totalInventoryValue || 0)}
            icon={DollarSign}
            variant="primary"
          />
          <StatCard
            title="Ventas Hoy"
            value={isLoading ? "..." : formatPrice(stats?.todayIncome || 0)}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Compras Hoy"
            value={isLoading ? "..." : formatPrice(stats?.todayExpenses || 0)}
            icon={TrendingDown}
            variant="warning"
          />
        </div>

        {/* Products Table */}
        <ProductsTable products={products || []} isLoading={productsLoading} />

        {/* Alerts and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LowStockAlert products={stats?.lowStockProducts || []} />
          <TopProducts products={stats?.topSellingProducts || []} />
          <TopDebtors debtors={debtors || []} />
        </div>
      </div>

      <MultiSaleDialog open={isSaleOpen} onOpenChange={setIsSaleOpen} />
    </MainLayout>
  );
};

export default Index;
