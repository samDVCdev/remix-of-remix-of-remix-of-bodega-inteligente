import { Package, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen del inventario de tu bodega</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Productos"
            value={isLoading ? "..." : stats?.totalProducts || 0}
            icon={Package}
            variant="default"
          />
          <StatCard
            title="Valor del Inventario"
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

        {/* Alerts and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LowStockAlert products={stats?.lowStockProducts || []} />
          <TopProducts products={stats?.topSellingProducts || []} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
