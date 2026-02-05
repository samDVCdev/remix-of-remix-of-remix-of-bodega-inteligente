import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product, UnitEquivalence } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { Minus, Plus } from "lucide-react";

interface EquivalenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (product: Product, equivalence: UnitEquivalence | null, quantity: number) => void;
}

export function EquivalenceModal({ open, onOpenChange, product, onConfirm }: EquivalenceModalProps) {
  const [selectedEquivalence, setSelectedEquivalence] = useState<UnitEquivalence | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { formatPrice } = useCurrency();

  // Filter out purchase package equivalences (display_order === 999)
  // These are only for inventory management, not for sale
  const saleEquivalences = (product?.equivalences || []).filter(
    eq => eq.display_order !== 999
  );
  
  const hasEquivalences = saleEquivalences.length > 0;

  // Auto-select first equivalence when modal opens
  useEffect(() => {
    if (open && saleEquivalences.length > 0 && !selectedEquivalence) {
      setSelectedEquivalence(saleEquivalences[0]);
    }
  }, [open, saleEquivalences.length]);

  if (!product) return null;

  const handleSelectEquivalence = (equivalence: UnitEquivalence) => {
    setSelectedEquivalence(equivalence);
    setQuantity(1);
  };

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(product, selectedEquivalence, quantity);
      setSelectedEquivalence(null);
      setQuantity(1);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedEquivalence(null);
    setQuantity(1);
    onOpenChange(false);
  };

  // Get the price for the selected option
  const getPrice = () => {
    return selectedEquivalence?.price || 0;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] lg:max-w-[500px] bg-card mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            {product.name}
          </DialogTitle>
          <p className="text-center text-muted-foreground text-sm">
            {hasEquivalences ? "Seleccione la presentación" : "Ingrese la cantidad"}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Options list - Only show sale equivalences, no separate base unit option */}
          <div className="space-y-2">
            {saleEquivalences.map((eq) => (
              <button
                key={eq.id}
                onClick={() => handleSelectEquivalence(eq)}
                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                  selectedEquivalence?.id === eq.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium capitalize">{eq.unit_name}</span>
                  <span className="text-xs text-muted-foreground">
                    = {eq.base_unit_multiplier} {product.base_unit}(s)
                  </span>
                </div>
                <span className="text-primary font-bold">{formatPrice(eq.price)}</span>
              </button>
            ))}
          </div>

          {/* Quantity selector */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">Cantidad</p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-12 w-12"
              >
                <Minus className="w-5 h-5" />
              </Button>
              <span className="text-3xl font-display font-bold w-16 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-12 w-12"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-between mt-4">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-2xl font-display font-bold text-primary">
                {formatPrice(getPrice() * quantity)}
              </span>
            </div>
            
            {selectedEquivalence && (
              <p className="text-xs text-center text-muted-foreground">
                Se descontarán {selectedEquivalence.base_unit_multiplier * quantity} {product.base_unit}(s) del inventario
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 touch-button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 touch-button bg-primary"
            >
              Agregar al Carrito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
