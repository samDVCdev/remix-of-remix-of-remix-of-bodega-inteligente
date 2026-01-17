import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, FileText } from "lucide-react";
import { useMovements } from "@/hooks/useMovements";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterType, setFilterType] = useState<string>("todos");

  const { data: movements, isLoading } = useMovements();

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

  const totalSalidas = filteredMovements
    ?.filter((m) => m.movement_type === "salida")
    .reduce((sum, m) => sum + Number(m.total_amount), 0) || 0;

  const balance = totalSalidas - totalEntradas;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              Reportes
            </h1>
            <p className="text-muted-foreground mt-1">Genera reportes de movimientos por período</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Tipo de Movimiento
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="salida">Salidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card bg-success/5 border-success/20">
            <p className="text-sm font-medium text-muted-foreground">Total Ventas</p>
            <p className="text-2xl font-display font-bold text-success">
              ${totalSalidas.toFixed(2)}
            </p>
          </div>
          <div className="stat-card bg-warning/5 border-warning/20">
            <p className="text-sm font-medium text-muted-foreground">Total Compras</p>
            <p className="text-2xl font-display font-bold text-warning">
              ${totalEntradas.toFixed(2)}
            </p>
          </div>
          <div className={cn(
            "stat-card",
            balance >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
          )}>
            <p className="text-sm font-medium text-muted-foreground">Balance</p>
            <p className={cn(
              "text-2xl font-display font-bold",
              balance >= 0 ? "text-success" : "text-destructive"
            )}>
              {balance >= 0 ? "+" : ""}{balance.toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* Movements Table */}
        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold">
              Movimientos ({filteredMovements?.length || 0})
            </h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando movimientos...
            </div>
          ) : filteredMovements?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No hay movimientos en el período seleccionado
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements?.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.movement_date), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        movement.movement_type === "entrada"
                          ? "bg-success/15 text-success"
                          : "bg-primary/15 text-primary"
                      )}>
                        {movement.movement_type === "entrada" ? "Entrada" : "Salida"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{movement.product?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {movement.product?.code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {Number(movement.quantity).toFixed(2)} {movement.product?.unit}
                    </TableCell>
                    <TableCell>${Number(movement.unit_price).toFixed(2)}</TableCell>
                    <TableCell className={cn(
                      "font-semibold",
                      movement.movement_type === "entrada" ? "text-warning" : "text-success"
                    )}>
                      ${Number(movement.total_amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
