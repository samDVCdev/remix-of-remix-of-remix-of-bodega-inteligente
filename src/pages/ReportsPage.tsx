import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useMovements } from "@/hooks/useMovements";
import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { exportMovementsToExcel, exportMovementsToPDF } from "@/lib/exportUtils";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterType, setFilterType] = useState<string>("todos");

  const { data: movements, isLoading } = useMovements();
  const { formatPrice, currencySymbol } = useCurrency();

  const filteredMovements = movements?.filter((m) => {
    const movementDate = new Date(m.movement_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dateMatch = movementDate >= start && movementDate <= end;
    const typeMatch = filterType === "todos" || m.movement_type === filterType;

    return dateMatch && typeMatch;
  });

  const totalEntradas = filteredMovements
    ?.filter((m) => m.movement_type === "entrada")
    .reduce((sum, m) => sum + Number(m.total_amount), 0) || 0;

  const totalVentas = filteredMovements
    ?.filter((m) => m.movement_type === "salida")
    .reduce((sum, m) => sum + Number(m.total_amount), 0) || 0;

  const balance = totalVentas - totalEntradas;

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
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Genera reportes de movimientos</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => filteredMovements && exportMovementsToExcel(filteredMovements, startDate, endDate)}
              disabled={!filteredMovements?.length}
              className="gap-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => filteredMovements && exportMovementsToPDF(filteredMovements, startDate, endDate)}
              disabled={!filteredMovements?.length}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Fecha Inicio</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Fecha Fin</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="salida">Ventas</SelectItem>
                </SelectContent>
              </Select>
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
            <p className="text-xl sm:text-2xl font-display font-bold text-warning">{formatPrice(totalEntradas)}</p>
          </div>
          <div className={cn("stat-card", balance >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
            <p className="text-sm font-medium text-muted-foreground">Balance</p>
            <p className={cn("text-xl sm:text-2xl font-display font-bold", balance >= 0 ? "text-success" : "text-destructive")}>
              {balance >= 0 ? "+" : ""}{formatPrice(balance)}
            </p>
          </div>
        </div>

        {/* Movements Table */}
        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold">Movimientos ({filteredMovements?.length || 0})</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : filteredMovements?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay movimientos en el período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden sm:table-cell">Producto</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead className="hidden sm:table-cell">P.Unit</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements?.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-xs sm:text-sm">{format(new Date(movement.movement_date), "dd/MM/yy")}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", movement.movement_type === "entrada" ? "bg-success/15 text-success" : "bg-primary/15 text-primary")}>
                          {movement.movement_type === "entrada" ? "E" : "V"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[150px] truncate">{movement.product?.name}</TableCell>
                      <TableCell>{Number(movement.quantity).toFixed(0)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatPrice(Number(movement.unit_price))}</TableCell>
                      <TableCell className={cn("font-semibold", movement.movement_type === "entrada" ? "text-warning" : "text-success")}>
                        {formatPrice(Number(movement.total_amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
