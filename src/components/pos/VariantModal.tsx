import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product, ProductVariant } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { Minus, Plus } from "lucide-react";

interface VariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (product: Product, variant: ProductVariant, quantity: number) => void;
}

export function VariantModal({ open, onOpenChange, product, onConfirm }: VariantModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { formatPrice } = useCurrency();

  if (!product) return null;

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleConfirm = () => {
    if (selectedVariant && quantity > 0) {
      onConfirm(product, selectedVariant, quantity);
      setSelectedVariant(null);
      setQuantity(1);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedVariant(null);
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-card mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            {product.name}
          </DialogTitle>
          <p className="text-center text-muted-foreground text-sm">
            Elija presentación y cantidad
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Variants list */}
          <div className="space-y-2">
            {product.variants?.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleSelectVariant(variant)}
                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                  selectedVariant?.id === variant.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium">{variant.name}</span>
                <span className="text-primary font-bold">{formatPrice(variant.price)}</span>
              </button>
            ))}
          </div>

          {/* Quantity selector (shown after variant selection) */}
          {selectedVariant && (
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
                  {formatPrice(selectedVariant.price * quantity)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 touch-button"
            >
              Cancelar
            </Button>
            {selectedVariant && (
              <Button
                onClick={handleConfirm}
                className="flex-1 touch-button bg-primary"
              >
                Agregar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}