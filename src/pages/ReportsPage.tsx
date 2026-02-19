import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, FileSpreadsheet, AlertTriangle, TrendingUp, CreditCard, Clock, Banknote, List, Users } from "lucide-react";
import { useMovements } from "@/hooks/useMovements";
import { useProducts } from "@/hooks/useProducts";
import { useCurrency } from "@/hooks/useCurrency";
import { exportMovementsToExcel, exportMovementsToPDF, exportFullReportPDF } from "@/lib/exportUtils";
import { ReportLowStock } from "@/components/reports/ReportLowStock";
import { ReportTopProducts } from "@/components/reports/ReportTopProducts";
import { ReportCredits } from "@/components/reports/ReportCredits";
import { ReportSalesHeatmap } from "@/components/reports/ReportSalesHeatmap";
import { ReportPaymentMethods } from "@/components/reports/ReportPaymentMethods";
import { ReportSellerStats } from "@/components/reports/ReportSellerStats";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: movements, isLoading: movementsLoading } = useMovements();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { formatPrice, formatDualPrice, exchangeRate } = useCurrency();

  // Fetch profiles for seller name resolution in PDF
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, username");
      if (error) throw error;
      return data;
    },
  });
  const profileMap: Record<string, string> = {};
  profiles?.forEach(p => { profileMap[p.user_id] = p.full_name || p.username || 'Sin nombre'; });

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

  // Pagination for movements table
  const pagination = usePagination(filteredMovements, { initialItemsPerPage: 15 });
  const paginatedMovements = pagination.paginatedData;

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
              onClick={() => filteredMovements.length && exportFullReportPDF({
                movements: filteredMovements,
                products: products || [],
                startDate,
                endDate,
                exchangeRate,
                profileMap,
              })}
              disabled={!filteredMovements.length}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF Completo</span>
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

        {/* Summary Cards - Dual Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card bg-success/5 border-success/20">
            <p className="text-sm font-medium text-muted-foreground">Total Ventas</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-success">${totalVentas.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Bs. {(totalVentas * exchangeRate).toFixed(2)}</p>
          </div>
          <div className="stat-card bg-warning/5 border-warning/20">
            <p className="text-sm font-medium text-muted-foreground">Total Compras</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-warning">${totalCompras.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Bs. {(totalCompras * exchangeRate).toFixed(2)}</p>
          </div>
          <div className={`stat-card ${balance >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
            <p className="text-sm font-medium text-muted-foreground">Balance</p>
            <p className={`text-xl sm:text-2xl font-display font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
              {balance >= 0 ? "+" : ""}${balance.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {balance >= 0 ? "+" : ""}Bs. {(balance * exchangeRate).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="movements" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="movements" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <List className="w-3.5 h-3.5" />
              Movimientos
            </TabsTrigger>
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
            <TabsTrigger value="sellers" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5" />
              Vendedores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movements">
            <div className="stat-card p-0 overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-display font-semibold">Movimientos del Período ({filteredMovements.length})</h3>
              </div>
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Cargando...</div>
              ) : filteredMovements.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No hay movimientos en este período</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="table-header">
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cant.</TableHead>
                          <TableHead>P. Unit (USD)</TableHead>
                          <TableHead>Total (USD)</TableHead>
                          <TableHead>Total (Bs)</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMovements.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {format(new Date(m.movement_date), "dd/MM/yy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={m.movement_type === "salida" ? "default" : "secondary"} className="text-[10px]">
                                {m.movement_type === "salida" ? "Venta" : "Entrada"}
                              </Badge>
                              {m.is_credit && (
                                <Badge variant="outline" className="text-[10px] ml-1 border-warning text-warning">F</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-sm max-w-[120px] truncate">
                              {m.product?.name || "—"}
                            </TableCell>
                            <TableCell className="text-sm">{m.quantity}</TableCell>
                            <TableCell className="text-sm">${Number(m.unit_price).toFixed(2)}</TableCell>
                            <TableCell className="text-sm font-semibold">${Number(m.total_amount).toFixed(2)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              Bs. {(Number(m.total_amount) * exchangeRate).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                              {m.notes || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <TablePagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.onPageChange}
                    totalItems={filteredMovements.length}
                    itemsPerPage={15}
                  />
                </>
              )}
            </div>
          </TabsContent>

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

          <TabsContent value="sellers">
            <ReportSellerStats movements={filteredMovements} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
