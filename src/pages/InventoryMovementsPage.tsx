import { useState, useMemo } from "react";
import { Trash2, Package, Eye, Search, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MovementDetailDialog } from "@/components/movements/MovementDetailDialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { useMovements, useDeleteMovement } from "@/hooks/useMovements";
import { usePagination } from "@/hooks/usePagination";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { InventoryMovement } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function InventoryMovementsPage() {
  const [deletingMovement, setDeletingMovement] = useState<InventoryMovement | null>(null);
  const [viewingMovement, setViewingMovement] = useState<InventoryMovement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "entrada" | "salida">("all");

  const { isAdmin } = useAuth();
  const { data: movements, isLoading } = useMovements();
  const deleteMovement = useDeleteMovement();
  const { exchangeRate } = useCurrency();

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    return movements.filter(m => {
      const matchesSearch = !searchTerm ||
        m.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const mDate = new Date(m.movement_date);
      const matchesStart = !startDate || mDate >= new Date(startDate);
      const matchesEnd = !endDate || mDate <= new Date(endDate + "T23:59:59");
      const matchesType = typeFilter === "all" || m.movement_type === typeFilter;
      return matchesSearch && matchesStart && matchesEnd && matchesType;
    });
  }, [movements, searchTerm, startDate, endDate, typeFilter]);

  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
  } = usePagination(filteredMovements, { initialItemsPerPage: 10 });

  const handleDelete = async () => {
    if (deletingMovement) {
      await deleteMovement.mutateAsync(deletingMovement.id);
      setDeletingMovement(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            Movimientos de Inventario
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Historial de entradas y salidas de inventario</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
            </select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 w-[140px]"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-[140px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando movimientos...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay movimientos registrados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="hidden sm:table-cell">Cant.</TableHead>
                      <TableHead className="hidden md:table-cell">Precio</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.map((movement) => {
                      const isEntry = movement.movement_type === "entrada";
                      return (
                        <TableRow
                          key={movement.id}
                          className="animate-fade-in cursor-pointer hover:bg-muted/50"
                          onClick={() => setViewingMovement(movement)}
                        >
                          <TableCell className="text-xs sm:text-sm">
                            {format(new Date(movement.movement_date), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {isEntry ? (
                              <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                                <ArrowDownToLine className="w-3 h-3" />
                                Entrada
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-primary border-primary/20 bg-primary/5">
                                <ArrowUpFromLine className="w-3 h-3" />
                                Salida
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[120px] sm:max-w-[180px]">
                              <p className="font-medium truncate text-sm">{movement.product?.name}</p>
                              {movement.is_credit && (
                                <span className="text-xs text-amber-500 font-medium">FIADO</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {Number(movement.quantity).toFixed(0)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            <div>
                              <p>${Number(movement.unit_price).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Bs. {(Number(movement.unit_price) * exchangeRate).toFixed(2)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            <div>
                              <p className={isEntry ? "text-emerald-600" : "text-primary"}>
                                ${Number(movement.total_amount).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Bs. {(Number(movement.total_amount) * exchangeRate).toFixed(2)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setViewingMovement(movement); }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); setDeletingMovement(movement); }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalItems > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={onPageChange}
                  onItemsPerPageChange={onItemsPerPageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      <MovementDetailDialog
        open={!!viewingMovement}
        onOpenChange={() => setViewingMovement(null)}
        movement={viewingMovement}
      />

      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el movimiento y revertirá el stock. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
