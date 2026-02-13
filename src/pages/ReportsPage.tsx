import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, FileSpreadsheet, AlertTriangle, TrendingUp, CreditCard, Clock, Banknote } from "lucide-react";
import { useMovements } from "@/hooks/useMovements";
import { useProducts } from "@/hooks/useProducts";
import { useCurrency } from "@/hooks/useCurrency";
import { exportMovementsToExcel, exportMovementsToPDF } from "@/lib/exportUtils";
import { ReportLowStock } from "@/components/reports/ReportLowStock";
import { ReportTopProducts } from "@/components/reports/ReportTopProducts";
import { ReportCredits } from "@/components/reports/ReportCredits";
import { ReportSalesHeatmap } from "@/components/reports/ReportSalesHeatmap";
import { ReportPaymentMethods } from "@/components/reports/ReportPaymentMethods";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: movements, isLoading: movementsLoading } = useMovements();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { formatPrice } = useCurrency();

  const filteredMovements = movements?.filter((m) => {
    const movementDate = new Date(m.movement_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return movementDate >= start && movementDate <= end;
  }) || [];

  const totalVentas = filteredMovements
    .filter((m) => m.movement_type === "salida")
    .reduce((sum, m) => sum + Number(m.total_amount), 0);

  const totalCompras = filteredMovements
    .filter((m) => m.movement_type === "entrada")
    .reduce((sum, m) => sum + Number(m.total_amount), 0);

  const balance = totalVentas - totalCompras;

  const isLoading = movementsLoading || productsLoading;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              Reportes
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Panel completo de reportes y análisis</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => filteredMovements.length && exportMovementsToExcel(filteredMovements, startDate, endDate)}
              disabled={!filteredMovements.length}
              className="gap-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => filteredMovements.length && exportMovementsToPDF(filteredMovements, startDate, endDate)}
              disabled={!filteredMovements.length}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Período</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Fecha Inicio</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Fecha Fin</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card bg-success/5 border-success/20">
            <p className="text-sm font-medium text-muted-foreground">Total Ventas</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-success">{formatPrice(totalVentas)}</p>
          </div>
          <div className="stat-card bg-warning/5 border-warning/20">
            <p className="text-sm font-medium text-muted-foreground">Total Compras</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-warning">{formatPrice(totalCompras)}</p>
          </div>
          <div className={`stat-card ${balance >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
            <p className="text-sm font-medium text-muted-foreground">Balance</p>
            <p className={`text-xl sm:text-2xl font-display font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
              {balance >= 0 ? "+" : ""}{formatPrice(balance)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="stock" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <AlertTriangle className="w-3.5 h-3.5" />
              Stock Bajo
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CreditCard className="w-3.5 h-3.5" />
              Fiados
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5" />
              Horas
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Banknote className="w-3.5 h-3.5" />
              Métodos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <ReportLowStock products={products || []} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="ranking">
            <ReportTopProducts movements={filteredMovements} products={products || []} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="credits">
            <ReportCredits movements={filteredMovements} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="hours">
            <ReportSalesHeatmap movements={filteredMovements} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="payments">
            <ReportPaymentMethods movements={filteredMovements} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
