import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";

interface WeightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (product: Product, kg: number) => void;
}

export function WeightModal({ open, onOpenChange, product, onConfirm }: WeightModalProps) {
  const [kg, setKg] = useState("");
  const { formatPrice } = useCurrency();

  if (!product) return null;

  const kgValue = parseFloat(kg) || 0;
  const pricePerKilo = product.price_per_kilo || 0;
  const total = pricePerKilo * kgValue;

  const handleConfirm = () => {
    if (kgValue > 0) {
      onConfirm(product, kgValue);
      setKg("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setKg("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-card mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* KG input */}
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              step="0.1"
              className="text-center text-4xl h-20 font-display pr-14"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl font-semibold">
              KG
            </span>
          </div>

          {/* Price display */}
          <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="text-3xl font-display font-bold text-primary">
              {formatPrice(total)}
            </span>
          </div>

          {/* Price per kilo info */}
          <p className="text-center text-sm text-muted-foreground">
            Precio: {formatPrice(pricePerKilo)} / KG
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 touch-button"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={kgValue <= 0}
              className="flex-1 touch-button bg-primary"
            >
              Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
