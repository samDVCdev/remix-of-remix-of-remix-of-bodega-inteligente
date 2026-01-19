import { useState, useEffect } from "react";
import { Plus, Trash2, Minus, Package, ShoppingCart, ArrowDownToLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCreateMovement } from "@/hooks/useMovements";
import { Product } from "@/types/inventory";
import { toast } from "sonner";

interface MovementItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

interface MultiMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "entrada" | "salida";
}

export function MultiMovementDialog({ open, onOpenChange, type }: MultiMovementDialogProps) {
  const { data: products } = useProducts();
  const createMovement = useCreateMovement();
  
  const [items, setItems] = useState<MovementItem[]>([
    { product_id: "", quantity: 1, unit_price: 0 }
  ]);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setItems([{ product_id: "", quantity: 1, unit_price: 0 }]);
      setMovementDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [open]);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof MovementItem, value: string | number) => {
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

  const incrementQuantity = (index: number) => {
    const newItems = [...items];
    newItems[index].quantity = (newItems[index].quantity || 0) + 1;
    setItems(newItems);
  };

  const decrementQuantity = (index: number) => {
    const newItems = [...items];
    if (newItems[index].quantity > 1) {
      newItems[index].quantity = newItems[index].quantity - 1;
      setItems(newItems);
    }
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

    // Check stock for sales
    if (type === "salida") {
      for (const item of validItems) {
        const product = products?.find(p => p.id === item.product_id);
        if (product && item.quantity > product.stock) {
          toast.error(`Stock insuficiente para ${product.name}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      for (const item of validItems) {
        await createMovement.mutateAsync({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          movement_date: movementDate,
          movement_type: type,
          notes: notes || undefined,
        });
      }
      
      const message = type === "entrada" 
        ? `Entrada registrada: ${validItems.length} producto(s)`
        : `Venta registrada: ${validItems.length} producto(s)`;
      toast.success(message);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Error al registrar ${type === "entrada" ? "la entrada" : "la venta"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSale = type === "salida";
  const title = isSale ? "Registrar Ventas" : "Registrar Entradas";
  const subtitle = isSale 
    ? "Registra múltiples productos en una sola venta" 
    : "Registra múltiples productos en una sola entrada";
  const iconColor = isSale ? "text-primary" : "text-success";
  const bgColor = isSale ? "bg-primary/10" : "bg-success/10";
  const borderColor = isSale ? "border-primary/20" : "border-success/20";
  const Icon = isSale ? ShoppingCart : ArrowDownToLine;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-card max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Fecha
            </label>
            <Input
              type="date"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Productos</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="w-4 h-4" />
                Agregar Producto
              </Button>
            </div>

            {items.map((item, index) => {
              const selectedProduct = products?.find(p => p.id === item.product_id);
              return (
                <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
                  {/* Product Select */}
                  <div className="flex gap-2">
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
                            <span className="text-muted-foreground ml-2 text-xs">
                              (Stock: {product.stock})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
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

                  {/* Quantity and Price Row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Quantity with +/- buttons */}
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Cantidad {selectedProduct && `(${selectedProduct.unit})`}
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => decrementQuantity(index)}
                          disabled={item.quantity <= 1}
                          className="h-10 w-10 shrink-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => incrementQuantity(index)}
                          className="h-10 w-10 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Price - editable */}
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Precio Unitario
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Subtotal</label>
                      <div className={`h-10 flex items-center px-3 rounded-md ${bgColor} ${borderColor} border font-semibold ${iconColor}`}>
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Stock Info */}
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      Stock disponible: <span className="font-medium">{selectedProduct.stock} {selectedProduct.unit}</span>
                      {isSale && item.quantity > selectedProduct.stock && (
                        <span className="text-destructive ml-2">⚠️ Stock insuficiente</span>
                      )}
                    </p>
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
          <div className={`p-4 rounded-lg ${bgColor} border ${borderColor}`}>
            <p className="text-sm text-muted-foreground">Total:</p>
            <p className={`text-3xl font-display font-bold ${iconColor}`}>
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
              {isSubmitting 
                ? "Registrando..." 
                : isSale ? "Registrar Ventas" : "Registrar Entradas"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
