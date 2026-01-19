import { useState } from "react";
import { Plus, Trash2, ShoppingCart, Package, Eye } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MultiMovementDialog } from "@/components/movements/MultiMovementDialog";
import { MovementDetailDialog } from "@/components/movements/MovementDetailDialog";
import { useMovements, useDeleteMovement } from "@/hooks/useMovements";
import { useCurrency } from "@/hooks/useCurrency";
import { InventoryMovement } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function SalesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState<InventoryMovement | null>(null);
  const [viewingMovement, setViewingMovement] = useState<InventoryMovement | null>(null);

  const { data: movements, isLoading } = useMovements("salida");
  const deleteMovement = useDeleteMovement();
  const { formatPrice } = useCurrency();

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              Ventas
            </h1>
            <p className="text-muted-foreground mt-1">Registro de ventas de inventario</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Venta
          </Button>
        </div>

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
              <Button onClick={() => setIsFormOpen(true)} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Registrar Primera Venta
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements?.map((movement) => (
                  <TableRow 
                    key={movement.id} 
                    className="animate-fade-in cursor-pointer hover:bg-muted/50"
                    onClick={() => setViewingMovement(movement)}
                  >
                    <TableCell>
                      {format(new Date(movement.movement_date), "dd MMM yyyy", { locale: es })}
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
                    <TableCell>{formatPrice(Number(movement.unit_price))}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatPrice(Number(movement.total_amount))}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {movement.notes || "-"}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Multi Movement Dialog */}
      <MultiMovementDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type="salida"
      />

      {/* Detail Dialog */}
      <MovementDetailDialog
        open={!!viewingMovement}
        onOpenChange={() => setViewingMovement(null)}
        movement={viewingMovement}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent className="bg-card">
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
