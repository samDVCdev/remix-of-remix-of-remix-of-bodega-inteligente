import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Product } from "@/types/inventory";
import { useProductsWithVariants } from "@/hooks/useProducts";
import { PackagePlus, Search, Scale, Ruler, Droplets, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InventoryEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EntryMode = "package" | "unit" | "measure";

// Get measurement info based on base_unit
const getMeasurementInfo = (baseUnit: string) => {
  switch (baseUnit) {
    case "gramo":
      return { 
        measureLabel: "Kilogramos", 
        measureAbbr: "kg",
        icon: Scale,
        multiplier: 1000,
        type: "weight"
      };
    case "centimetro":
      return { 
        measureLabel: "Metros", 
        measureAbbr: "mt",
        icon: Ruler,
        multiplier: 100,
        type: "length"
      };
    case "mililitro":
      return { 
        measureLabel: "Litros", 
        measureAbbr: "lt",
        icon: Droplets,
        multiplier: 1000,
        type: "volume"
      };
    default:
      return { 
        measureLabel: "Unidades", 
        measureAbbr: "un",
        icon: Package,
        multiplier: 1,
        type: "unit"
      };
  }
};

export function InventoryEntryDialog({ open, onOpenChange }: InventoryEntryDialogProps) {
  const queryClient = useQueryClient();
  const { data: products } = useProductsWithVariants();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [entryMode, setEntryMode] = useState<EntryMode>("package");
  const [selectedEquivalenceId, setSelectedEquivalenceId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);

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

  const measurementInfo = useMemo(() => {
    if (!selectedProduct) return getMeasurementInfo("unidad");
    return getMeasurementInfo(selectedProduct.base_unit);
  }, [selectedProduct]);

  const isMeasureBasedProduct = measurementInfo.type !== "unit";

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
      setPurchasePrice(0);
    }
  }, [open]);

  // Set default equivalence, entry mode and price when product changes
  useEffect(() => {
    if (mainPackage) {
      setSelectedEquivalenceId(mainPackage.id);
    }
    if (selectedProduct) {
      // Show bulk purchase price (per-unit price * package multiplier)
      const bulkPrice = mainPackage 
        ? selectedProduct.purchase_price * mainPackage.base_unit_multiplier
        : selectedProduct.purchase_price;
      setPurchasePrice(bulkPrice);
    }
    // For measure-based products, default to measure entry
    if (isMeasureBasedProduct) {
      setEntryMode("measure");
    } else {
      setEntryMode("package");
    }
  }, [mainPackage, isMeasureBasedProduct, selectedProduct]);

  const calculateUnitsToAdd = () => {
    if (entryMode === "unit") {
      return quantity;
    }
    if (entryMode === "measure") {
      // Convert from measure unit (kg, mt, lt) to base units (g, cm, ml)
      return quantity * measurementInfo.multiplier;
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

      // Calculate per-unit purchase price from bulk price
      const packageMultiplier = mainPackage?.base_unit_multiplier || 1;
      const perUnitPurchasePrice = packageMultiplier > 0
        ? purchasePrice / packageMultiplier
        : purchasePrice;

      // Update product stock and purchase price
      const { error } = await supabase
        .from("products")
        .update({ 
          stock_base_units: newStock,
          stock: newStock,
          purchase_price: perUnitPurchasePrice,
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      // Determine package name based on entry mode
      let packageName = selectedProduct.base_unit;
      let unitsPerPackage = 1;

      if (entryMode === "package" && selectedEquivalence) {
        packageName = selectedEquivalence.unit_name;
        unitsPerPackage = selectedEquivalence.base_unit_multiplier;
      } else if (entryMode === "measure") {
        packageName = measurementInfo.measureAbbr;
        unitsPerPackage = measurementInfo.multiplier;
      }

      // Record the inventory movement
      await supabase.from("inventory_movements").insert({
        product_id: selectedProduct.id,
        movement_type: "entrada",
        quantity: unitsToAdd, // Store in base units
        unit_price: selectedProduct.purchase_price || 0,
        total_amount: quantity * (selectedProduct.purchase_price || 0),
        package_type: packageName,
        units_per_package: unitsPerPackage,
        unit_equivalence_id: entryMode === "package" ? selectedEquivalenceId : null,
        notes: `Ingreso de ${quantity} ${packageName} = ${unitsToAdd} ${selectedProduct.base_unit}s`,
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

  const getReadableStock = () => {
    if (!selectedProduct) return "";
    const stock = selectedProduct.stock_base_units;
    
    if (isMeasureBasedProduct) {
      const mainUnits = stock / measurementInfo.multiplier;
      return `${mainUnits.toFixed(2)} ${measurementInfo.measureAbbr}`;
    }
    
    if (mainPackage && stock > 0) {
      const packages = Math.floor(stock / mainPackage.base_unit_multiplier);
      const remainder = Math.round(stock % mainPackage.base_unit_multiplier);
      if (packages > 0 && remainder > 0) {
        return `${packages} ${mainPackage.unit_name}(s) + ${remainder} ${selectedProduct.base_unit}s`;
      } else if (packages > 0) {
        return `${packages} ${mainPackage.unit_name}(s)`;
      }
    }
    
    return `${stock} ${getBaseUnitLabel()}`;
  };

  const MeasureIcon = measurementInfo.icon;

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
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-60">
                {filteredProducts.map((product) => {
                  const info = getMeasurementInfo(product.base_unit);
                  const Icon = info.icon;
                  return (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {product.name} ({product.code})
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <>
              {/* Product Type Indicator */}
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <MeasureIcon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">
                  Producto vendido por {measurementInfo.measureLabel.toLowerCase()}
                </span>
              </div>

              {/* Entry Mode Toggle */}
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                  Modo de Ingreso
                </Label>
                <div className="flex border rounded-lg overflow-hidden">
                  {/* Package mode - always available */}
                  <Button
                    type="button"
                    variant={entryMode === "package" ? "default" : "ghost"}
                    className="flex-1 rounded-none h-12"
                    onClick={() => setEntryMode("package")}
                  >
                    Por {mainPackage?.unit_name || "Bultos"}
                  </Button>
                  
                  {/* Measure mode - only for measure-based products */}
                  {isMeasureBasedProduct && (
                    <Button
                      type="button"
                      variant={entryMode === "measure" ? "default" : "ghost"}
                      className="flex-1 rounded-none h-12"
                      onClick={() => setEntryMode("measure")}
                    >
                      Por {measurementInfo.measureLabel}
                    </Button>
                  )}
                  
                  {/* Unit mode - for unit-based products or direct base unit entry */}
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

              {/* Purchase Price */}
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                  Precio de Compra ($) — por {mainPackage?.unit_name || selectedProduct.base_unit}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="h-12 text-lg text-center font-semibold"
                  placeholder="0.00"
                />
                {mainPackage && mainPackage.base_unit_multiplier > 1 && purchasePrice > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    = <span className="font-semibold text-primary">${(purchasePrice / mainPackage.base_unit_multiplier).toFixed(4)}</span> por {selectedProduct.base_unit}
                  </p>
                )}
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                  Cantidad a Sumar {entryMode === "measure" && `(${measurementInfo.measureAbbr.toUpperCase()})`}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={entryMode === "measure" ? "0.01" : "1"}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="h-14 text-2xl text-center font-bold"
                  placeholder="0"
                />
                {quantity > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    = <span className="font-semibold text-primary">{calculateUnitsToAdd().toLocaleString()}</span> {getBaseUnitLabel()} a agregar
                  </p>
                )}
              </div>

              {/* Current Stock Info */}
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Stock actual</p>
                <p className="text-lg font-bold">
                  {getReadableStock()}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({selectedProduct.stock_base_units.toLocaleString()} {getBaseUnitLabel()} en total)
                </p>
              </div>
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedProduct || quantity <= 0 || isSubmitting}
            className="w-full h-14 gap-2 text-base font-semibold"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackagePlus className="w-5 h-5" />}
            {isSubmitting ? "Cargando..." : "Confirmar Carga"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
