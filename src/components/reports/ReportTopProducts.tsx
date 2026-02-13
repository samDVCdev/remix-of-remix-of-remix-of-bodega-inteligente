import { TrendingUp, TrendingDown } from "lucide-react";
import { InventoryMovement, Product } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";

interface ReportTopProductsProps {
  movements: InventoryMovement[];
  products: Product[];
  isLoading: boolean;
}

export function ReportTopProducts({ movements, products, isLoading }: ReportTopProductsProps) {
  const { formatPrice } = useCurrency();

  const sales = movements.filter((m) => m.movement_type === "salida");

  // Aggregate sales by product
  const salesByProduct: Record<string, { qty: number; revenue: number }> = {};
  sales.forEach((s) => {
    if (!salesByProduct[s.product_id]) {
      salesByProduct[s.product_id] = { qty: 0, revenue: 0 };
    }
    salesByProduct[s.product_id].qty += Number(s.quantity);
    salesByProduct[s.product_id].revenue += Number(s.total_amount);
  });

  const ranked = Object.entries(salesByProduct)
    .map(([productId, data]) => ({
      product: products.find((p) => p.id === productId),
      ...data,
    }))
    .filter((item) => item.product)
    .sort((a, b) => b.qty - a.qty);

  const topSelling = ranked.slice(0, 10);
  const leastSelling = [...ranked].sort((a, b) => a.qty - b.qty).slice(0, 10);

  // Products with zero sales
  const soldProductIds = new Set(Object.keys(salesByProduct));
  const noSalesProducts = products.filter((p) => !soldProductIds.has(p.id));

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Selling */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Más Vendidos</h3>
            <p className="text-xs text-muted-foreground">Top 10 productos por cantidad vendida</p>
          </div>
        </div>
        {topSelling.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay ventas registradas</div>
        ) : (
          <div className="divide-y divide-border">
            {topSelling.map((item, i) => (
              <div key={item.product!.id} className="flex items-center gap-3 p-3 px-4">
                <span className="w-7 h-7 rounded-full bg-success/10 text-success text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product!.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product!.code}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-success">{item.qty.toFixed(0)} uds</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Least Selling */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <TrendingDown className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Menos Vendidos</h3>
            <p className="text-xs text-muted-foreground">Productos con menos ventas (excluye sin ventas)</p>
          </div>
        </div>
        {leastSelling.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay ventas registradas</div>
        ) : (
          <div className="divide-y divide-border">
            {leastSelling.map((item, i) => (
              <div key={item.product!.id} className="flex items-center gap-3 p-3 px-4">
                <span className="w-7 h-7 rounded-full bg-warning/10 text-warning text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product!.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product!.code}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-warning">{item.qty.toFixed(0)} uds</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No Sales Products */}
      {noSalesProducts.length > 0 && (
        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold text-muted-foreground">
              Sin Ventas ({noSalesProducts.length})
            </h3>
          </div>
          <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
            {noSalesProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 px-4">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.code}</p>
                </div>
                <span className="text-xs text-muted-foreground">0 ventas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
