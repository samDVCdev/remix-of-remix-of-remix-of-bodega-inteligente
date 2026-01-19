import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { InventoryMovement } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownToLine, ArrowUpFromLine, Package, Calendar, DollarSign, FileText, Layers } from "lucide-react";

interface MovementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: InventoryMovement | null;
}

export function MovementDetailDialog({ open, onOpenChange, movement }: MovementDetailDialogProps) {
  if (!movement) return null;

  const isEntry = movement.movement_type === "entrada";
  const Icon = isEntry ? ArrowDownToLine : ArrowUpFromLine;
  const colorClass = isEntry ? "text-success" : "text-primary";
  const bgColorClass = isEntry ? "bg-success/10" : "bg-primary/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColorClass}`}>
              <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            Detalle de {isEntry ? "Entrada" : "Salida"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-background">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{movement.product?.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{movement.product?.code}</p>
              </div>
              <Badge variant={isEntry ? "default" : "secondary"} className={isEntry ? "bg-success" : ""}>
                {isEntry ? "Entrada" : "Salida"}
              </Badge>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Fecha</span>
              </div>
              <p className="font-medium pl-6">
                {format(new Date(movement.movement_date), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="w-4 h-4" />
                <span className="text-sm">Cantidad</span>
              </div>
              <p className="font-medium pl-6">
                {Number(movement.quantity).toFixed(2)} {movement.product?.unit}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Precio Unitario</span>
              </div>
              <p className="font-medium pl-6">${Number(movement.unit_price).toFixed(2)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <p className={`font-bold pl-6 text-lg ${colorClass}`}>
                ${Number(movement.total_amount).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Package Info for entries */}
          {isEntry && movement.package_type && movement.package_type !== "individual" && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground">
                Tipo de empaque: <span className="font-medium text-foreground capitalize">{movement.package_type}</span>
              </p>
              {movement.units_per_package && movement.units_per_package > 1 && (
                <p className="text-sm text-muted-foreground">
                  Unidades por {movement.package_type}: <span className="font-medium text-foreground">{movement.units_per_package}</span>
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {movement.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Notas</span>
              </div>
              <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border">
                {movement.notes}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Registrado el {format(new Date(movement.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
