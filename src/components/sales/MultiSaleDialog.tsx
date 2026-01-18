import { useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCreateMovement } from "@/hooks/useMovements";
import { MultiSaleItem } from "@/types/inventory";
import { toast } from "sonner";

interface MultiSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiSaleDialog({ open, onOpenChange }: MultiSaleDialogProps) {
  const { data: products } = useProducts();
  const createMovement = useCreateMovement();
  
  const [items, setItems] = useState<MultiSaleItem[]>([
    { product_id: "", quantity: 0, unit_price: 0 }
  ]);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 0, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof MultiSaleItem, value: string | number) => {
    const newItems = [...items];
    if (field === "product_id") {
      const product = products?.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        product_id: value as string,
        unit_price: product?.price_usd || 0,
        product
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async () => {
    const validItems = items.filter(item => item.product_id && item.quantity > 0);
    
    if (validItems.length === 0) {
      toast.error("Agrega al menos un producto válido");
      return;
    }

    setIsSubmitting(true);
    try {
      for (const item of validItems) {
        await createMovement.mutateAsync({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          movement_date: saleDate,
          movement_type: "salida",
          notes: notes || undefined,
        });
      }
      
      toast.success(`Venta registrada: ${validItems.length} producto(s)`);
      onOpenChange(false);
      setItems([{ product_id: "", quantity: 0, unit_price: 0 }]);
      setNotes("");
    } catch (error) {
      toast.error("Error al registrar la venta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setItems([{ product_id: "", quantity: 0, unit_price: 0 }]);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px] bg-card max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Registrar Venta Múltiple
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Fecha de Venta
            </label>
            <Input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Productos</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>

            {items.map((item, index) => {
              const selectedProduct = products?.find(p => p.id === item.product_id);
              return (
                <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <Select 
                    value={item.product_id} 
                    onValueChange={(value) => updateItem(index, "product_id", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover max-h-[200px]">
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <span className="font-mono text-xs mr-2">{product.code}</span>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Cant."
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />

                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Precio"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {selectedProduct && (
                    <div className="text-xs text-muted-foreground w-full sm:hidden">
                      Stock: {selectedProduct.stock} {selectedProduct.unit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Notas (opcional)
            </label>
            <Textarea
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Total */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Total de la Venta:</p>
            <p className="text-3xl font-display font-bold text-primary">
              ${getTotal().toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {items.filter(i => i.product_id && i.quantity > 0).length} producto(s)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Registrar Venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
