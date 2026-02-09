import { useState, useMemo } from "react";
import { Plus, Trash2, ShoppingCart, Package, Eye, Search, CalendarIcon } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MultiSaleDialog } from "@/components/sales/MultiSaleDialog";
import { Input } from "@/components/ui/input";
import { MovementDetailDialog } from "@/components/movements/MovementDetailDialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { useMovements, useDeleteMovement } from "@/hooks/useMovements";
import { usePagination } from "@/hooks/usePagination";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessStatus } from "@/hooks/useBusinessStatus";
import { InventoryMovement } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function SalesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState<InventoryMovement | null>(null);
  const [viewingMovement, setViewingMovement] = useState<InventoryMovement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { isAdmin } = useAuth();
  const { data: businessStatus } = useBusinessStatus();
  const { data: movements, isLoading } = useMovements("salida");
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
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [movements, searchTerm, startDate, endDate]);

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

  const handleNewSale = () => {
    if (!isAdmin && businessStatus && !businessStatus.is_open) {
      toast.error("El negocio está cerrado. No puedes registrar ventas.");
      return;
    }
    setIsFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              Ventas
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Registro de ventas de inventario</p>
          </div>
          <Button onClick={handleNewSale} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Venta
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
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

        {/* Business Status Warning for Employees */}
        {!isAdmin && businessStatus && !businessStatus.is_open && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="font-medium">⚠️ El negocio está cerrado</p>
            <p className="text-sm opacity-80">No puedes registrar ventas en este momento.</p>
          </div>
        )}

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando ventas...
            </div>
          ) : movements?.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay ventas registradas</p>
              <Button onClick={handleNewSale} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Registrar Primera Venta
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="hidden sm:table-cell">Cant.</TableHead>
                      <TableHead className="hidden md:table-cell">Precio</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.map((movement) => (
                      <TableRow 
                        key={movement.id} 
                        className="animate-fade-in cursor-pointer hover:bg-muted/50"
                        onClick={() => setViewingMovement(movement)}
                      >
                        <TableCell className="text-xs sm:text-sm">
                          {format(new Date(movement.movement_date), "dd MMM", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[100px] sm:max-w-[150px]">
                            <p className="font-medium truncate text-sm">{movement.product?.name}</p>
                            {movement.is_credit && (
                              <span className="text-xs text-amber-500 font-medium">FIADO</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {(() => {
                            const qty = Number(movement.quantity);
                            const ups = Number(movement.units_per_package) || 1;
                            const total = Number(movement.total_amount);
                            const unitPrice = Number(movement.unit_price);
                            // If there's an equivalence, show presentation quantity
                            if (movement.unit_equivalence_id && unitPrice > 0) {
                              const presentationQty = Math.round(total / unitPrice);
                              return presentationQty;
                            }
                            return qty.toFixed(0);
                          })()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          <div>
                            {movement.product?.sale_type === 'weight' ? (
                              <>
                                <p>${((Number(movement.total_amount) / Number(movement.quantity)) * 1000).toFixed(2)}/kg</p>
                                <p className="text-xs text-muted-foreground">Bs. {((Number(movement.total_amount) / Number(movement.quantity)) * 1000 * exchangeRate).toFixed(2)}/kg</p>
                              </>
                            ) : (
                              <>
                                <p>${Number(movement.unit_price).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Bs. {(Number(movement.unit_price) * exchangeRate).toFixed(2)}</p>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          <div>
                            <p className="text-primary">${Number(movement.total_amount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Bs. {(Number(movement.total_amount) * exchangeRate).toFixed(2)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingMovement(movement);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingMovement(movement);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

      {/* Multi Sale Dialog */}
      <MultiSaleDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      {/* Detail Dialog */}
      <MovementDetailDialog
        open={!!viewingMovement}
        onOpenChange={() => setViewingMovement(null)}
        movement={viewingMovement}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la venta y revertirá el stock del producto. 
              Esta acción no se puede deshacer.
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
