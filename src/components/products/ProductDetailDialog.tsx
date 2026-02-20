import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Package, DollarSign, TrendingUp, TrendingDown, Calendar, Scale, Layers } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductDetailDialog({ open, onOpenChange, product }: ProductDetailDialogProps) {
  const { formatPrice, exchangeRate } = useCurrency();

  if (!product) return null;

  const isLowStock = product.stock_base_units <= product.low_stock_threshold;
  const margin = product.sale_price - product.purchase_price;
  const marginPercent = product.purchase_price > 0 
    ? ((margin / product.purchase_price) * 100).toFixed(1) 
    : 0;

  const getSaleTypeInfo = () => {
    switch (product.sale_type) {
      case 'weight':
        return { icon: Scale, label: 'Por Peso (Kilogramos)', color: 'text-accent' };
      case 'variants':
        return { icon: Layers, label: 'Múltiples Presentaciones', color: 'text-primary' };
      default:
        return { icon: Package, label: 'Por Unidad', color: 'text-muted-foreground' };
    }
  };

  const saleTypeInfo = getSaleTypeInfo();
  const SaleTypeIcon = saleTypeInfo.icon;

  // Función para mostrar stock legible
  const getReadableStock = () => {
    if (product.base_unit === 'gramo') {
      return `${(product.stock_base_units / 1000).toFixed(1)} KG`;
    }
    return `${product.stock_base_units} ${product.base_unit}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Detalle del Producto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with name */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 bg-muted", saleTypeInfo.color)}>
                <SaleTypeIcon className="w-3 h-3" />
                {saleTypeInfo.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                Unidad base: {product.base_unit}
              </span>
            </div>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
            )}
          </div>

          {/* Stock Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Stock Actual</p>
              <p className="text-xl font-bold">{getReadableStock()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Estado</p>
              <Badge className={cn(
                "mt-1",
                isLowStock 
                  ? "bg-destructive/10 text-destructive border-destructive/20" 
                  : "bg-primary/10 text-primary border-primary/20"
              )}>
                {isLowStock ? "Stock Bajo" : "Stock Normal"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Mínimo: {product.base_unit === 'gramo' 
                  ? `${(product.low_stock_threshold / 1000).toFixed(1)} KG`
                  : `${product.low_stock_threshold} ${product.base_unit}s`
                }
              </p>
            </div>
          </div>

          {/* Prices based on sale type */}
          <div className="space-y-3">
            {product.sale_type === 'weight' ? (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    <span className="text-sm">Precio por Kilo</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">${(product.price_per_kilo || 0).toFixed(2)}</span>
                    <p className="text-xs text-muted-foreground">
                      Bs. {((product.price_per_kilo || 0) * exchangeRate).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ) : product.sale_type === 'variants' && product.variants ? (
              <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Presentaciones</span>
                </div>
                {product.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm">{variant.name}</span>
                    <div className="text-right">
                      <span className="font-semibold text-primary">${variant.price.toFixed(2)}</span>
                      <p className="text-xs text-muted-foreground">
                        Bs. {(variant.price * exchangeRate).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Purchase prices - bulk and unit */}
                {(() => {
                  const purchaseEquiv = product.equivalences?.find(e => e.display_order === 999) 
                    || product.equivalences?.reduce((max, e) => 
                      e.base_unit_multiplier > (max?.base_unit_multiplier || 0) ? e : max, 
                      product.equivalences?.[0]
                    );
                  const packageMultiplier = purchaseEquiv?.base_unit_multiplier || 1;
                  // purchase_price in DB could be bulk or per-unit depending on when it was saved
                  // Use the equivalence price as the authoritative bulk price
                  const bulkPurchasePrice = purchaseEquiv?.price || product.purchase_price;
                  const unitPurchasePrice = packageMultiplier > 1 
                    ? bulkPurchasePrice / packageMultiplier 
                    : product.purchase_price;
                  const unitSalePrice = product.sale_price;
                  const bulkSalePrice = unitSalePrice * packageMultiplier;
                  const unitMargin = unitSalePrice - unitPurchasePrice;
                  const unitMarginPercent = unitPurchasePrice > 0 ? ((unitMargin / unitPurchasePrice) * 100).toFixed(1) : '0';
                  const bulkMargin = bulkSalePrice - bulkPurchasePrice;
                  const bulkMarginPercent = bulkPurchasePrice > 0 ? ((bulkMargin / bulkPurchasePrice) * 100).toFixed(1) : '0';
                  const packageName = purchaseEquiv?.unit_name || 'Bulto';

                  return (
                    <>
                      {/* Bulk purchase price */}
                      <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium">Precio de Compra ({packageName})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Por {packageName} ({packageMultiplier} uds)</span>
                          <div className="text-right">
                            <span className="font-semibold">${bulkPurchasePrice.toFixed(2)}</span>
                            <p className="text-xs text-muted-foreground">Bs. {(bulkPurchasePrice * exchangeRate).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-sm text-muted-foreground">Por Unidad</span>
                          <div className="text-right">
                            <span className="font-semibold">${unitPurchasePrice.toFixed(2)}</span>
                            <p className="text-xs text-muted-foreground">Bs. {(unitPurchasePrice * exchangeRate).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sale price */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm">Precio de Venta (Unidad)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary">${unitSalePrice.toFixed(2)}</span>
                          <p className="text-xs text-muted-foreground">Bs. {(unitSalePrice * exchangeRate).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Margins */}
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-success" />
                          <span className="text-sm font-medium">Margen de Ganancia</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Por Unidad</span>
                          <span className="font-semibold text-success">
                            ${unitMargin.toFixed(2)} ({unitMarginPercent}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-sm text-muted-foreground">Por {packageName}</span>
                          <span className="font-semibold text-success">
                            ${bulkMargin.toFixed(2)} ({bulkMarginPercent}%)
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {/* Inventory Value */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm text-muted-foreground">Valor en Inventario</p>
            {(() => {
              // For weight products: convert grams to kilos and multiply by price_per_kilo
              const inventoryValue = product.sale_type === 'weight'
                ? (product.stock_base_units / 1000) * (product.price_per_kilo || 0)
                : product.sale_price * product.stock_base_units;
              return (
                <>
                  <p className="text-2xl font-display font-bold text-primary">
                    ${inventoryValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bs. {(inventoryValue * exchangeRate).toFixed(2)}
                  </p>
                </>
              );
            })()}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              Creado: {format(new Date(product.created_at), "dd MMM yyyy", { locale: es })}
              {product.updated_at !== product.created_at ? (
                <> · Actualizado: {format(new Date(product.updated_at), "dd MMM yyyy", { locale: es })}</>
              ) : null}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
