import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Product, UNITS, SALE_TYPES, SaleType } from "@/types/inventory";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Package, Scale, Layers, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const variantSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  price: z.coerce.number().min(0, "Precio debe ser >= 0"),
  units_count: z.coerce.number().min(1, "Mínimo 1").optional(),
});

const productSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  purchase_price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  sale_price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  stock: z.coerce.number().min(0, "El stock debe ser mayor o igual a 0"),
  unit: z.string().min(1, "La unidad es requerida"),
  low_stock_threshold: z.coerce.number().min(0, "El umbral debe ser mayor o igual a 0"),
  category_id: z.string().optional(),
  sale_type: z.enum(['unit', 'weight', 'variants']),
  price_per_kilo: z.coerce.number().min(0).optional(),
  variants: z.array(variantSchema).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategories();
  const isEditing = !!product;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      purchase_price: 0,
      sale_price: 0,
      stock: 0,
      unit: "unidades",
      low_stock_threshold: 5,
      category_id: "",
      sale_type: "unit",
      price_per_kilo: 0,
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const saleType = form.watch("sale_type");

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        description: product.description || "",
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        stock: product.stock,
        unit: product.unit,
        low_stock_threshold: product.low_stock_threshold,
        category_id: product.category_id || "",
        sale_type: product.sale_type || "unit",
        price_per_kilo: product.price_per_kilo || 0,
        variants: product.variants?.map(v => ({
          name: v.name,
          price: v.price,
          units_count: v.units_count || 1,
        })) || [],
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        purchase_price: 0,
        sale_price: 0,
        stock: 0,
        unit: "unidades",
        low_stock_threshold: 5,
        category_id: "",
        sale_type: "unit",
        price_per_kilo: 0,
        variants: [],
      });
    }
  }, [product, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const payload = {
        ...data,
        category_id: data.category_id || null,
        variants: data.sale_type === 'variants' ? data.variants : undefined,
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

  const getSaleTypeIcon = (type: SaleType) => {
    switch (type) {
      case 'weight': return <Scale className="w-5 h-5" />;
      case 'variants': return <Layers className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Sale Type Selection */}
            <FormField
              control={form.control}
              name="sale_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Venta *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 gap-2"
                    >
                      {SALE_TYPES.map((type) => (
                        <div key={type.value} className="flex items-center">
                          <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type.value}
                            className="flex flex-1 items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            {getSaleTypeIcon(type.value as SaleType)}
                            <span className="font-medium">{type.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="PRD-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover">
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción del producto (opcional)" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price fields based on sale type */}
            {saleType === 'weight' ? (
              <FormField
                control={form.control}
                name="price_per_kilo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio por Kilo (USD) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : saleType === 'variants' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Presentaciones / Variantes *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", price: 0, units_count: 1 })}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>
                
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    Agrega al menos una presentación
                  </p>
                )}

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start p-3 bg-muted/30 rounded-lg border">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Ej: Unidad, Paquete 6, Caja 12"
                        {...form.register(`variants.${index}.name`)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Precio"
                          {...form.register(`variants.${index}.price`)}
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="Unidades"
                          {...form.register(`variants.${index}.units_count`)}
                          className="w-24"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Compra (USD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Venta (USD) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Inicial</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        min="0" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="low_stock_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        min="0" 
                        placeholder="5" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {createProduct.isPending || updateProduct.isPending 
                  ? "Guardando..." 
                  : isEditing ? "Actualizar" : "Guardar Producto"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}