import { ArrowDownToLine, ShoppingCart, Calendar, Package, DollarSign, FileText, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InventoryMovement } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCurrency } from "@/hooks/useCurrency";

interface MovementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: InventoryMovement | null;
}

export function MovementDetailDialog({ open, onOpenChange, movement }: MovementDetailDialogProps) {
  const { formatPrice, exchangeRate, currency } = useCurrency();
  
  if (!movement) return null;

  const isEntry = movement.movement_type === "entrada";
  const Icon = isEntry ? ArrowDownToLine : ShoppingCart;
  const colorClass = isEntry ? "text-success" : "text-primary";
  const bgColorClass = isEntry ? "bg-success/10" : "bg-primary/10";

  // Format dual currency
  const formatDualPrice = (usdAmount: number) => {
    const vesAmount = usdAmount * exchangeRate;
    return (
      <div className="text-right">
        <p className="font-bold">${usdAmount.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Bs. {vesAmount.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColorClass}`}>
              <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            Detalle de {isEntry ? "Entrada" : "Venta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className={`p-4 rounded-lg ${bgColorClass} border ${isEntry ? "border-success/20" : "border-primary/20"}`}>
            <div className="flex items-center gap-3">
              <Package className={`w-8 h-8 ${colorClass}`} />
              <div>
                <p className="font-display font-bold text-lg">{movement.product?.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{movement.product?.code}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Fecha</span>
              </div>
              <p className="font-semibold">
                {format(new Date(movement.movement_date), "dd MMM yyyy", { locale: es })}
              </p>
            </div>

            <div className="stat-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-medium">Cantidad</span>
              </div>
              <p className="font-semibold">
                {Number(movement.quantity).toFixed(2)} {movement.product?.unit}
              </p>
            </div>

            <div className="stat-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Precio Unitario</span>
              </div>
              {formatDualPrice(Number(movement.unit_price))}
            </div>

            <div className={`stat-card p-4 ${bgColorClass}`}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Total</span>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${colorClass}`}>
                  ${Number(movement.total_amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bs. {(Number(movement.total_amount) * exchangeRate).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {movement.notes && (
            <div className="stat-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium">Notas</span>
              </div>
              <p className="text-sm">{movement.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            Registrado: {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
