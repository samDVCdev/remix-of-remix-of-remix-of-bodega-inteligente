import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Product, BASE_UNITS } from "@/types/inventory";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Plus, Trash2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";

const salePriceSchema = z.object({
  unit_name: z.string().min(1, "Nombre requerido"),
  base_unit_multiplier: z.coerce.number().min(1, "Mínimo 1"),
  price: z.coerce.number().min(0, "Precio debe ser >= 0"),
});

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  base_unit: z.string().min(1, "La unidad mínima es requerida"),
  // Empaque de compra (cómo se compra el producto)
  purchase_package_name: z.string().min(1, "Nombre del empaque requerido"),
  purchase_package_units: z.coerce.number().min(1, "Mínimo 1 unidad"),
  purchase_price: z.coerce.number().min(0, "Precio debe ser >= 0"),
  // Precios de venta (equivalencias)
  sale_prices: z.array(salePriceSchema).min(1, "Agrega al menos un precio de venta"),
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

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      base_unit: "unidad",
      purchase_package_name: "Bulto",
      purchase_package_units: 1,
      purchase_price: 0,
      sale_prices: [{ unit_name: "Unidad", base_unit_multiplier: 1, price: 0 }],
    },
  });

  const { fields: salePriceFields, append: appendSalePrice, remove: removeSalePrice } = useFieldArray({
    control: form.control,
    name: "sale_prices",
  });

  useEffect(() => {
    if (product) {
      // Find the main purchase equivalence (highest multiplier)
      const purchaseEquiv = product.equivalences?.reduce((max, e) => 
        e.base_unit_multiplier > (max?.base_unit_multiplier || 0) ? e : max, 
        product.equivalences[0]
      );
      
      form.reset({
        name: product.name,
        base_unit: product.base_unit || "unidad",
        purchase_package_name: purchaseEquiv?.unit_name || "Bulto",
        purchase_package_units: purchaseEquiv?.base_unit_multiplier || 1,
        purchase_price: product.purchase_price,
        sale_prices: product.equivalences?.length ? product.equivalences.map(e => ({
          unit_name: e.unit_name,
          base_unit_multiplier: e.base_unit_multiplier,
          price: e.price,
        })) : [{ unit_name: "Unidad", base_unit_multiplier: 1, price: product.sale_price }],
      });
    } else {
      form.reset({
        name: "",
        base_unit: "unidad",
        purchase_package_name: "Bulto",
        purchase_package_units: 1,
        purchase_price: 0,
        sale_prices: [{ unit_name: "Unidad", base_unit_multiplier: 1, price: 0 }],
      });
    }
  }, [product, form, open]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Generate code from name
      const code = data.name.substring(0, 3).toUpperCase() + "-" + Date.now().toString().slice(-4);
      
      // Build equivalences array including purchase package
      const equivalences = data.sale_prices.map((sp, index) => ({
        unit_name: sp.unit_name,
        base_unit_multiplier: sp.base_unit_multiplier,
        price: sp.price,
        display_order: index,
      }));

      // Add purchase package as an equivalence if not already in sale prices
      const hasPurchasePackage = equivalences.some(
        e => e.unit_name.toLowerCase() === data.purchase_package_name.toLowerCase()
      );
      if (!hasPurchasePackage) {
        equivalences.push({
          unit_name: data.purchase_package_name,
          base_unit_multiplier: data.purchase_package_units,
          price: data.purchase_price, // or calculate sale price
          display_order: equivalences.length,
        });
      }

      // Find base price (unit price)
      const unitPrice = data.sale_prices.find(sp => sp.base_unit_multiplier === 1)?.price || 
                        data.sale_prices[0]?.price || 0;

      const payload = {
        code: isEditing && product ? product.code : code,
        name: data.name,
        base_unit: data.base_unit,
        unit: data.base_unit + "es", // pluralize
        purchase_price: data.purchase_price,
        sale_price: unitPrice,
        stock_base_units: isEditing ? product?.stock_base_units || 0 : 0, // Don't set stock here
        low_stock_threshold: 10,
        sale_type: 'unit' as const,
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

  const baseUnit = form.watch("base_unit");
  const getBaseUnitLabel = () => {
    const unit = BASE_UNITS.find(u => u.value === baseUnit);
    return unit?.label || "Unidad";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] bg-card mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide">
            {isEditing ? "Editar Producto" : "Configuración Inicial"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Name and Base Unit */}
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
                      <Input placeholder="Ej: Harina" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider">
                      Unidad Mínima
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {BASE_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label} ({unit.value.substring(0, 2)})
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider">
                        Costo por Bulto ($)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0" 
                          className="h-12"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_package_units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider text-primary">
                        Stock Inicial (Bultos)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          min="0" 
                          placeholder="0" 
                          className="h-12 border-primary/50"
                          disabled
                          value={0}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Usa "Ingreso Inventario" después
                      </p>
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
                        Nombre de Empaque (Compra)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Bulto" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_package_units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground tracking-wider">
                        Contenido por Bulto
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          min="1" 
                          placeholder="1" 
                          className="h-12"
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {getBaseUnitLabel()}s por empaque
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sale Prices Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                  Precios de Venta
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => appendSalePrice({ unit_name: "", base_unit_multiplier: 1, price: 0 })}
                  className="gap-1 text-primary"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </Button>
              </div>

              {salePriceFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nombre (Unidad, Paquete...)"
                    className="flex-1 h-12"
                    {...form.register(`sale_prices.${index}.unit_name`)}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    className="w-20 h-12"
                    {...form.register(`sale_prices.${index}.base_unit_multiplier`)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Precio $"
                    className="w-24 h-12"
                    {...form.register(`sale_prices.${index}.price`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSalePrice(index)}
                    className="text-destructive hover:text-destructive shrink-0"
                    disabled={salePriceFields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Nombre | Cantidad de {getBaseUnitLabel()}s | Precio USD
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 gap-2 text-base font-semibold"
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              <Save className="w-5 h-5" />
              {isEditing ? "Actualizar Producto" : "Registrar Producto"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
