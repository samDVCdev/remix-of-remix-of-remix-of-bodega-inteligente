import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Product } from "@/types/inventory";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Plus, Trash2, Save, Scale, Ruler, Droplets, Package, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/hooks/useCurrency";

// Tipos de medida soportados
const MEASUREMENT_TYPES = [
  { value: "unit", label: "Por Unidades (Piezas)", baseUnit: "unidad", icon: Package },
  { value: "weight", label: "Por Peso (Kilogramos)", baseUnit: "gramo", icon: Scale },
  { value: "length", label: "Por Longitud (Metros)", baseUnit: "centimetro", icon: Ruler },
  { value: "volume", label: "Por Volumen (Litros)", baseUnit: "mililitro", icon: Droplets },
] as const;

type MeasurementType = typeof MEASUREMENT_TYPES[number]["value"];

const salePriceSchema = z.object({
  unit_name: z.string().min(1, "Nombre requerido"),
  base_unit_multiplier: z.coerce.number().min(1, "Mínimo 1"),
  price: z.coerce.number().min(0, "Precio debe ser >= 0"),
});

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  measurement_type: z.enum(["unit", "weight", "length", "volume"]),
  // Empaque de compra
  purchase_package_name: z.string().min(1, "Nombre del empaque requerido"),
  purchase_package_content: z.coerce.number().min(0.001, "Mínimo 0.001"),
  purchase_price: z.coerce.number().min(0, "Precio debe ser >= 0"),
  initial_stock_packages: z.coerce.number().min(0, "Mínimo 0"),
  // Para productos por peso/longitud/volumen: precio por unidad de medida
  price_per_measure_unit: z.coerce.number().min(0).optional(),
  // Para productos por unidades: presentaciones de venta
  sale_prices: z.array(salePriceSchema).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductCreateDialog({ open, onOpenChange, product }: ProductCreateDialogProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;
  const { exchangeRate } = useCurrency();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      measurement_type: "unit",
      purchase_package_name: "Bulto",
      purchase_package_content: 1,
      purchase_price: 0,
      initial_stock_packages: 0,
      price_per_measure_unit: 0,
      sale_prices: [{ unit_name: "Unidad", base_unit_multiplier: 1, price: 0 }],
    },
  });

  const { fields: salePriceFields, append: appendSalePrice, remove: removeSalePrice } = useFieldArray({
    control: form.control,
    name: "sale_prices",
  });

  const measurementType = form.watch("measurement_type");
  const pricePerMeasure = form.watch("price_per_measure_unit") || 0;
  const purchasePackageName = form.watch("purchase_package_name");

  const getMeasurementConfig = (type: MeasurementType) => {
    switch (type) {
      case "weight":
        return { 
          measureLabel: "KG", 
          contentLabel: "Kilogramos",
          priceLabel: "PRECIO DE VENTA POR KG",
          baseUnit: "gramo",
          multiplier: 1000 // 1kg = 1000g
        };
      case "length":
        return { 
          measureLabel: "MT", 
          contentLabel: "Metros",
          priceLabel: "PRECIO DE VENTA POR MT",
          baseUnit: "centimetro",
          multiplier: 100 // 1m = 100cm
        };
      case "volume":
        return { 
          measureLabel: "LT", 
          contentLabel: "Litros",
          priceLabel: "PRECIO DE VENTA POR LT",
          baseUnit: "mililitro",
          multiplier: 1000 // 1L = 1000ml
        };
      default:
        return { 
          measureLabel: "UN", 
          contentLabel: "Unidades",
          priceLabel: "PRECIO POR UNIDAD",
          baseUnit: "unidad",
          multiplier: 1
        };
    }
  };

  const config = getMeasurementConfig(measurementType);
  const isMeasureBasedSale = measurementType !== "unit";

  useEffect(() => {
    if (product) {
      // Find the largest equivalence (purchase package)
      const purchaseEquiv = product.equivalences?.reduce((max, e) => 
        e.base_unit_multiplier > (max?.base_unit_multiplier || 0) ? e : max, 
        product.equivalences[0]
      );
      
      // Sale equivalences are everything except the purchase package
      const saleEquivalences = product.equivalences?.filter(e => 
        e.id !== purchaseEquiv?.id
      ) || [];
      
      // Determine measurement type from base_unit
      let measType: MeasurementType = "unit";
      if (product.base_unit === "gramo") measType = "weight";
      else if (product.base_unit === "centimetro") measType = "length";
      else if (product.base_unit === "mililitro") measType = "volume";
      
      const measureConfig = getMeasurementConfig(measType);
      
      form.reset({
        name: product.name,
        measurement_type: measType,
        purchase_package_name: purchaseEquiv?.unit_name || "Bulto",
        purchase_package_content: purchaseEquiv ? purchaseEquiv.base_unit_multiplier / measureConfig.multiplier : 1,
      purchase_price: purchaseEquiv 
        ? product.purchase_price * purchaseEquiv.base_unit_multiplier 
        : product.purchase_price,
        initial_stock_packages: 0,
        price_per_measure_unit: product.price_per_kilo || 0,
        sale_prices: saleEquivalences.length > 0 
          ? saleEquivalences.map(e => ({
              unit_name: e.unit_name,
              base_unit_multiplier: e.base_unit_multiplier,
              price: e.price,
            }))
          : [{ unit_name: "Unidad", base_unit_multiplier: 1, price: product.sale_price }],
      });
    } else {
      form.reset({
        name: "",
        measurement_type: "unit",
        purchase_package_name: "Bulto",
        purchase_package_content: 1,
        purchase_price: 0,
        initial_stock_packages: 0,
        price_per_measure_unit: 0,
        sale_prices: [{ unit_name: "Unidad", base_unit_multiplier: 1, price: 0 }],
      });
    }
  }, [product, form, open]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const code = data.name.substring(0, 3).toUpperCase() + "-" + Date.now().toString().slice(-4);
      const measureConfig = getMeasurementConfig(data.measurement_type);
      
      let equivalences: Array<{
        unit_name: string;
        base_unit_multiplier: number;
        price: number;
        display_order: number;
      }> = [];

      let salePrice = 0;
      let saleType: 'unit' | 'weight' = 'unit';
      let pricePerKilo = 0;

      // Calculate purchase package multiplier in base units
      const packageMultiplier = data.purchase_package_content * measureConfig.multiplier;

      if (data.measurement_type === "unit") {
        // Products sold by unit - use sale prices (SEPARATE from purchase package)
        equivalences = (data.sale_prices || []).map((sp, index) => ({
          unit_name: sp.unit_name,
          base_unit_multiplier: sp.base_unit_multiplier,
          price: sp.price,
          display_order: index,
        }));
        salePrice = data.sale_prices?.find(sp => sp.base_unit_multiplier === 1)?.price || 
                    data.sale_prices?.[0]?.price || 0;
      } else {
        // Products sold by measure (weight, length, volume)
        saleType = 'weight'; // We'll use weight type for all measure-based products
        pricePerKilo = data.price_per_measure_unit || 0;
        salePrice = pricePerKilo;
      }

      // Add purchase package as a separate equivalence (ONLY for inventory management, NOT for sale)
      equivalences.push({
        unit_name: data.purchase_package_name,
        base_unit_multiplier: packageMultiplier,
        price: data.purchase_price, // This is purchase price, not sale price
        display_order: 999, // Put at end to differentiate
      });

      // Calculate initial stock in base units
      const initialStockBaseUnits = data.initial_stock_packages * packageMultiplier;

      // Calculate per-unit purchase price from bulk price
      const perUnitPurchasePrice = packageMultiplier > 0 
        ? data.purchase_price / packageMultiplier 
        : data.purchase_price;

      const payload = {
        code: isEditing && product ? product.code : code,
        name: data.name,
        base_unit: measureConfig.baseUnit,
        unit: measureConfig.baseUnit + "s",
        purchase_price: perUnitPurchasePrice,
        sale_price: salePrice,
        stock_base_units: isEditing ? product?.stock_base_units || 0 : initialStockBaseUnits,
        low_stock_threshold: 10,
        sale_type: saleType,
        price_per_kilo: pricePerKilo,
        equivalences,
      };

      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload } as any);
      } else {
        await createProduct.mutateAsync(payload as any);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const MeasureIcon = MEASUREMENT_TYPES.find(m => m.value === measurementType)?.icon || Package;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] bg-card mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide">
            {isEditing ? "Editar Producto" : "Nueva Ficha de Producto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Name and Measurement Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider">
                      Nombre del Producto
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Harina de Trigo" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measurement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider">
                      Unidad de Medida
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {MEASUREMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Purchase Package Section */}
            <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                  Configuración de Compra (Empaque)
                </Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-primary font-semibold tracking-wider">
                        Costo de Compra ($)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          className="h-12 text-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initial_stock_packages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-primary font-semibold tracking-wider">
                        Stock Inicial ({purchasePackageName}s)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          min="0" 
                          placeholder="0" 
                          className="h-12 text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchase_package_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider">
                        Empaque (Bulto/Caja/Saco)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Saco" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_package_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider">
                        Contenido por Empaque
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step={isMeasureBasedSale ? "0.01" : "1"}
                          min={isMeasureBasedSale ? "0.01" : "1"}
                          placeholder="Ej: 50" 
                          className="h-12"
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {config.contentLabel} por empaque
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sale Definition Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-primary">$</span>
                <Label className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                  Definición de Venta (Precios al Cliente)
                </Label>
              </div>

              {isMeasureBasedSale ? (
                /* Measure-based sale (weight, length, volume) */
                <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                    <MeasureIcon className="w-7 h-7 text-primary" />
                  </div>
                  
                  <p className="text-xs uppercase text-primary tracking-wider font-semibold">
                    {config.priceLabel}
                  </p>

                  <FormField
                    control={form.control}
                    name="price_per_measure_unit"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-2xl text-muted-foreground">$</span>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0" 
                              placeholder="0.00"
                              className="h-14 text-3xl font-bold text-center bg-muted/50 border-border max-w-[180px]"
                              {...field} 
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            title="Ver en Bs"
                          >
                            <span className="text-sm font-semibold">Bs</span>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Bs. {(pricePerMeasure * exchangeRate).toFixed(2)} / {config.measureLabel}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <p className="text-xs text-muted-foreground italic">
                    * El sistema permitirá pesar/medir al momento de vender
                  </p>
                </div>
              ) : (
                /* Unit-based sale - multiple presentations */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-muted-foreground tracking-wider">
                      Presentaciones de Venta (Unidad, Caja, Media...)
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => appendSalePrice({ unit_name: "", base_unit_multiplier: 1, price: 0 })}
                      className="gap-1 text-primary"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Otra
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    💡 Define aquí las presentaciones para VENDER (Ej: Unidad, Media Docena, Docena). 
                    El empaque de compra ({purchasePackageName}) es solo para control de inventario.
                  </p>

                  {salePriceFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center bg-muted/30 p-3 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Etiqueta</Label>
                        <Input
                          placeholder="Unidad"
                          className="h-10 mt-1"
                          {...form.register(`sale_prices.${index}.unit_name`)}
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-[10px] uppercase text-muted-foreground">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="1"
                          className="h-10 mt-1"
                          {...form.register(`sale_prices.${index}.base_unit_multiplier`)}
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-[10px] uppercase text-muted-foreground">Precio $</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="h-10 mt-1"
                          {...form.register(`sale_prices.${index}.price`)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSalePrice(index)}
                        className="text-destructive hover:text-destructive shrink-0 mt-5"
                        disabled={salePriceFields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 gap-2 text-base font-semibold"
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {(createProduct.isPending || updateProduct.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {(createProduct.isPending || updateProduct.isPending) ? "Guardando..." : "Guardar Producto"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
