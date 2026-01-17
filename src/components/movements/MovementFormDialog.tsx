import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProducts } from "@/hooks/useProducts";
import { useCreateMovement } from "@/hooks/useMovements";

const movementSchema = z.object({
  product_id: z.string().min(1, "Selecciona un producto"),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unit_price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  movement_date: z.string().min(1, "La fecha es requerida"),
  notes: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface MovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "entrada" | "salida";
}

export function MovementFormDialog({ open, onOpenChange, type }: MovementFormDialogProps) {
  const { data: products } = useProducts();
  const createMovement = useCreateMovement();

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: "",
      quantity: 0,
      unit_price: 0,
      movement_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const selectedProductId = form.watch("product_id");
  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  const onSubmit = async (data: MovementFormData) => {
    try {
      await createMovement.mutateAsync({
        ...data,
        movement_type: type,
      } as any);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const title = type === "entrada" ? "Registrar Entrada" : "Registrar Salida";
  const subtitle = type === "entrada" 
    ? "Registra una compra o entrada de inventario" 
    : "Registra una venta o salida de inventario";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover max-h-[300px]">
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <span className="font-mono text-xs mr-2">{product.code}</span>
                          {product.name}
                          <span className="text-muted-foreground ml-2">
                            (Stock: {product.stock} {product.unit})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cantidad {selectedProduct && `(${selectedProduct.unit})`} *
                    </FormLabel>
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
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {type === "entrada" ? "Precio de Compra" : "Precio de Venta"} (USD) *
                    </FormLabel>
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

            <FormField
              control={form.control}
              name="movement_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas adicionales (opcional)" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Preview */}
            {form.watch("quantity") > 0 && form.watch("unit_price") > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">Total:</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  ${(form.watch("quantity") * form.watch("unit_price")).toFixed(2)}
                </p>
              </div>
            )}

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
                disabled={createMovement.isPending}
              >
                {createMovement.isPending 
                  ? "Guardando..." 
                  : type === "entrada" ? "Registrar Entrada" : "Registrar Salida"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
