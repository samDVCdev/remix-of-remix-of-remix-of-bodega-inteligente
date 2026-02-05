import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Product, UnitEquivalence } from "@/types/inventory";
import { useProductsWithVariants } from "@/hooks/useProducts";
import { PackagePlus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InventoryEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryEntryDialog({ open, onOpenChange }: InventoryEntryDialogProps) {
  const queryClient = useQueryClient();
  const { data: products } = useProductsWithVariants();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [entryMode, setEntryMode] = useState<"package" | "unit">("package");
  const [selectedEquivalenceId, setSelectedEquivalenceId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    return products?.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const selectedEquivalence = useMemo(() => {
    if (!selectedProduct?.equivalences) return null;
    return selectedProduct.equivalences.find(e => e.id === selectedEquivalenceId) || null;
  }, [selectedProduct, selectedEquivalenceId]);

  // Get the main package equivalence (highest multiplier)
  const mainPackage = useMemo(() => {
    if (!selectedProduct?.equivalences?.length) return null;
    return selectedProduct.equivalences.reduce((max, e) => 
      e.base_unit_multiplier > (max?.base_unit_multiplier || 0) ? e : max,
      selectedProduct.equivalences[0]
    );
  }, [selectedProduct]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedProductId("");
      setEntryMode("package");
      setSelectedEquivalenceId("");
      setQuantity(0);
      setSearchTerm("");
    }
  }, [open]);

  // Set default equivalence when product changes
  useEffect(() => {
    if (mainPackage) {
      setSelectedEquivalenceId(mainPackage.id);
    }
  }, [mainPackage]);

  const calculateUnitsToAdd = () => {
    if (entryMode === "unit") {
      return quantity;
    }
    // Package mode
    if (selectedEquivalence) {
      return quantity * selectedEquivalence.base_unit_multiplier;
    }
    return quantity;
  };

  const handleSubmit = async () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error("Selecciona un producto y cantidad válida");
      return;
    }

    setIsSubmitting(true);
    try {
      const unitsToAdd = calculateUnitsToAdd();
      const newStock = (selectedProduct.stock_base_units || 0) + unitsToAdd;

      // Update product stock
      const { error } = await supabase
        .from("products")
        .update({ 
          stock_base_units: newStock,
          stock: newStock 
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      // Record the inventory movement
      const packageName = entryMode === "package" && selectedEquivalence 
        ? selectedEquivalence.unit_name 
        : selectedProduct.base_unit;

      await supabase.from("inventory_movements").insert({
        product_id: selectedProduct.id,
        movement_type: "entrada",
        quantity: quantity,
        unit_price: selectedProduct.purchase_price || 0,
        total_amount: quantity * (selectedProduct.purchase_price || 0),
        package_type: packageName,
        units_per_package: entryMode === "package" && selectedEquivalence 
          ? selectedEquivalence.base_unit_multiplier 
          : 1,
        unit_equivalence_id: entryMode === "package" ? selectedEquivalenceId : null,
        notes: `Ingreso de ${quantity} ${packageName}(s) = ${unitsToAdd} ${selectedProduct.base_unit}s`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-variants"] });
      
      toast.success(`Stock actualizado: +${unitsToAdd} ${selectedProduct.base_unit}s`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Error al actualizar el inventario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBaseUnitLabel = () => {
    if (!selectedProduct) return "unidades";
    return selectedProduct.base_unit + "s";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] lg:max-w-[550px] bg-card mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide">
            Cargar Inventario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Search/Select */}
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground tracking-wider">
              Seleccionar Producto
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 mb-2"
              />
            </div>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Buscar..." />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-60">
                {filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <>
              {/* Entry Mode Toggle */}
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                  Modo de Ingreso
                </Label>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    type="button"
                    variant={entryMode === "package" ? "default" : "ghost"}
                    className="flex-1 rounded-none h-12"
                    onClick={() => setEntryMode("package")}
                  >
                    Por {mainPackage?.unit_name || "Bultos"}
                  </Button>
                  <Button
                    type="button"
                    variant={entryMode === "unit" ? "default" : "ghost"}
                    className="flex-1 rounded-none h-12"
                    onClick={() => setEntryMode("unit")}
                  >
                    Por {selectedProduct.base_unit}s
                  </Button>
                </div>
              </div>

              {/* Package selection (only in package mode) */}
              {entryMode === "package" && selectedProduct.equivalences && selectedProduct.equivalences.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                    Tipo de Empaque
                  </Label>
                  <Select value={selectedEquivalenceId} onValueChange={setSelectedEquivalenceId}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar empaque" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {selectedProduct.equivalences.map((equiv) => (
                        <SelectItem key={equiv.id} value={equiv.id}>
                          {equiv.unit_name} (1 = {equiv.base_unit_multiplier} {getBaseUnitLabel()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                  Cantidad a Sumar
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="h-14 text-2xl text-center font-bold"
                  placeholder="0"
                />
                {quantity > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    = <span className="font-semibold text-primary">{calculateUnitsToAdd()}</span> {getBaseUnitLabel()} a agregar
                  </p>
                )}
              </div>

              {/* Current Stock Info */}
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Stock actual</p>
                <p className="text-lg font-bold">
                  {selectedProduct.stock_base_units} {getBaseUnitLabel()}
                  {mainPackage && selectedProduct.stock_base_units > 0 && (
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      (≈ {(selectedProduct.stock_base_units / mainPackage.base_unit_multiplier).toFixed(1)} {mainPackage.unit_name}s)
                    </span>
                  )}
                </p>
              </div>
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedProduct || quantity <= 0 || isSubmitting}
            className="w-full h-14 gap-2 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            <PackagePlus className="w-5 h-5" />
            Confirmar Carga
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
