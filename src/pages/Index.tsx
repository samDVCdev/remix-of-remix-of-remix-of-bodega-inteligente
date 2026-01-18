import { useState } from "react";
import { Package, DollarSign, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { ProductsTable } from "@/components/dashboard/ProductsTable";
import { MultiSaleDialog } from "@/components/sales/MultiSaleDialog";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: products, isLoading: productsLoading } = useProducts();
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
          <Button onClick={() => setIsSaleOpen(true)} className="gap-2 w-full sm:w-auto">
            <ShoppingCart className="w-4 h-4" />
            Registrar Venta
          </Button>
        </div>

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
            value={isLoading ? "..." : `$${(stats?.totalInventoryValue || 0).toFixed(2)}`}
            subtitle="USD"
            icon={DollarSign}
            variant="primary"
          />
          <StatCard
            title="Ventas del Día"
            value={isLoading ? "..." : `$${(stats?.todayIncome || 0).toFixed(2)}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Gastos del Día"
            value={isLoading ? "..." : `$${(stats?.todayExpenses || 0).toFixed(2)}`}
            icon={TrendingDown}
            variant="warning"
          />
        </div>

        {/* Products Table */}
        <ProductsTable products={products || []} isLoading={productsLoading} />

        {/* Alerts and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LowStockAlert products={stats?.lowStockProducts || []} />
          <TopProducts products={stats?.topSellingProducts || []} />
        </div>
      </div>

      <MultiSaleDialog open={isSaleOpen} onOpenChange={setIsSaleOpen} />
    </MainLayout>
  );
};

export default Index;
