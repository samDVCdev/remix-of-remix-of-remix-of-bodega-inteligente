import { useState } from "react";
import { Plus, Trash2, ShoppingCart, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/hooks/useProducts";
import { useCreateMovement } from "@/hooks/useMovements";
import { useAuth } from "@/hooks/useAuth";
import { MultiSaleItem } from "@/types/inventory";
import { toast } from "sonner";

interface MultiSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiSaleDialog({ open, onOpenChange }: MultiSaleDialogProps) {
  const { data: products } = useProducts();
  const createMovement = useCreateMovement();
  const { user } = useAuth();
  
  const [items, setItems] = useState<MultiSaleItem[]>([
    { product_id: "", quantity: 1, unit_price: 0 }
  ]);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isCredit, setIsCredit] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
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
        unit_price: product?.sale_price || 0,
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

    if (isCredit && !customerName.trim()) {
      toast.error("Ingresa el nombre del cliente para ventas fiadas");
      return;
    }

    // Check stock for sales
    for (const item of validItems) {
      const product = products?.find(p => p.id === item.product_id);
      if (product && item.quantity > product.stock) {
        toast.error(`Stock insuficiente para ${product.name}`);
        return;
      }
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
          is_credit: isCredit,
          customer_name: isCredit ? customerName : undefined,
          sold_by: user?.id,
        });
      }
      
      toast.success(`Venta ${isCredit ? "fiada " : ""}registrada: ${validItems.length} producto(s)`);
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error("Error al registrar la venta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setItems([{ product_id: "", quantity: 1, unit_price: 0 }]);
    setNotes("");
    setIsCredit(false);
    setCustomerName("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[650px] bg-card max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Registrar Venta
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Registra múltiples productos en una sola venta</p>
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

          {/* Credit Sale Toggle */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="credit-toggle" className="font-medium">Venta Fiada</Label>
                <p className="text-xs text-muted-foreground">Marcar si el cliente pagará después</p>
              </div>
              <Switch
                id="credit-toggle"
                checked={isCredit}
                onCheckedChange={setIsCredit}
              />
            </div>
            
            {isCredit && (
              <div>
                <Label className="text-sm">Nombre del Cliente *</Label>
                <Input
                  placeholder="Nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
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
                      <div className="h-10 flex items-center px-3 rounded-md bg-primary/10 border-primary/20 border font-semibold text-primary">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Stock Info */}
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      Stock disponible: <span className="font-medium">{selectedProduct.stock} {selectedProduct.unit}</span>
                      {item.quantity > selectedProduct.stock && (
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
          <div className={`p-4 rounded-lg ${isCredit ? 'bg-warning/10 border-warning/20' : 'bg-primary/10 border-primary/20'} border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de la Venta:</p>
                <p className={`text-3xl font-display font-bold ${isCredit ? 'text-warning' : 'text-primary'}`}>
                  ${getTotal().toFixed(2)}
                </p>
              </div>
              {isCredit && (
                <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium">
                  FIADO
                </span>
              )}
            </div>
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
