import { AlertTriangle } from "lucide-react";
import { Product } from "@/types/inventory";

interface LowStockAlertProps {
  products: Product[];
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  if (products.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10">
            <AlertTriangle className="w-5 h-5 text-success" />
          </div>
          <h3 className="font-display font-semibold text-foreground">Stock Bajo</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Todos los productos tienen stock suficiente
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-warning/10">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <h3 className="font-display font-semibold text-foreground">
          Stock Bajo ({products.length})
        </h3>
      </div>
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
          >
            <div>
              <p className="font-medium text-sm text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.code}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-warning">
                {product.base_unit === 'gramo' 
                  ? `${(product.stock_base_units / 1000).toFixed(1)} KG`
                  : `${product.stock} ${product.unit}`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Mín: {product.base_unit === 'gramo'
                  ? `${(product.low_stock_threshold / 1000).toFixed(1)} KG`
                  : product.low_stock_threshold
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
