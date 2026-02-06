import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartItem } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";

interface CreditSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total: number;
  onConfirm: (customerName: string) => void;
  isLoading?: boolean;
}

export function CreditSaleModal({ 
  open, 
  onOpenChange, 
  items, 
  total, 
  onConfirm,
  isLoading 
}: CreditSaleModalProps) {
  const [customerName, setCustomerName] = useState("");
  const { formatPrice } = useCurrency();

  const handleConfirm = () => {
    if (customerName.trim()) {
      onConfirm(customerName.trim());
      setCustomerName("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setCustomerName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-card mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            Registrar Fiao
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer name */}
          <div className="space-y-2">
            <Label htmlFor="customer-name">Nombre del Cliente *</Label>
            <Input
              id="customer-name"
              placeholder="Ingrese el nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
          </div>

          {/* Summary */}
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Productos:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total a fiar:</span>
              <span className="text-2xl font-display font-bold text-warning">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 touch-button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!customerName.trim() || isLoading}
              className="flex-1 touch-button bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isLoading ? "Procesando..." : "Confirmar Fiao"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}