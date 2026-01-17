import { TrendingUp } from "lucide-react";
import { Product } from "@/types/inventory";

interface TopProductsProps {
  products: { product: Product; totalSold: number }[];
}

export function TopProducts({ products }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">Más Vendidos</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No hay ventas registradas aún
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-foreground">Más Vendidos</h3>
      </div>
      <div className="space-y-3">
        {products.slice(0, 5).map((item, index) => (
          <div
            key={item.product.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-muted-foreground">{item.product.code}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary">
                {item.totalSold}
              </p>
              <p className="text-xs text-muted-foreground">{item.product.unit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
