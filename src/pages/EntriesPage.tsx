import { useState } from "react";
import { Plus, Trash2, ArrowDownToLine, Package } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MovementFormDialog } from "@/components/movements/MovementFormDialog";
import { useMovements, useDeleteMovement } from "@/hooks/useMovements";
import { InventoryMovement } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EntriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState<InventoryMovement | null>(null);

  const { data: movements, isLoading } = useMovements("entrada");
  const deleteMovement = useDeleteMovement();

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
              <div className="p-2 rounded-lg bg-success/10">
                <ArrowDownToLine className="w-6 h-6 text-success" />
              </div>
              Entradas
            </h1>
            <p className="text-muted-foreground mt-1">Registro de compras y entradas de inventario</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Entrada
          </Button>
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando entradas...
            </div>
          ) : movements?.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay entradas registradas</p>
              <Button onClick={() => setIsFormOpen(true)} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Registrar Primera Entrada
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
                  <TableRow key={movement.id} className="animate-fade-in">
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
                    <TableCell>${Number(movement.unit_price).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-success">
                      ${Number(movement.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {movement.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingMovement(movement)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <MovementFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type="entrada"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la entrada y revertirá el stock del producto. 
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
