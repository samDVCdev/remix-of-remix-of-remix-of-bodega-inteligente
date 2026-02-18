import { TrendingUp, TrendingDown } from "lucide-react";
import { InventoryMovement, Product } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ReportTopProductsProps {
  movements: InventoryMovement[];
  products: Product[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label, formatPrice }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold mb-1 text-foreground">{label}</p>
        <p className="text-muted-foreground">Cantidad: <span className="font-bold text-foreground">{payload[0]?.value?.toFixed(0)} uds</span></p>
        {payload[1] && (
          <p className="text-muted-foreground">Ingresos: <span className="font-bold text-success">{formatPrice(payload[1]?.value)}</span></p>
        )}
      </div>
    );
  }
  return null;
};

export function ReportTopProducts({ movements, products, isLoading }: ReportTopProductsProps) {
  const { formatPrice } = useCurrency();

  const sales = movements.filter((m) => m.movement_type === "salida");

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

  const soldProductIds = new Set(Object.keys(salesByProduct));
  const noSalesProducts = products.filter((p) => !soldProductIds.has(p.id));

  const topChartData = topSelling.map((item) => ({
    name: item.product!.name.length > 14 ? item.product!.name.slice(0, 14) + "…" : item.product!.name,
    fullName: item.product!.name,
    qty: item.qty,
    revenue: item.revenue,
  }));

  const leastChartData = leastSelling.map((item) => ({
    name: item.product!.name.length > 14 ? item.product!.name.slice(0, 14) + "…" : item.product!.name,
    fullName: item.product!.name,
    qty: item.qty,
    revenue: item.revenue,
  }));

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Selling Chart */}
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
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topChartData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={36} />
                <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
                <Bar dataKey="qty" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {topChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(var(--success) / ${1 - i * 0.07})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* List below chart */}
            <div className="divide-y divide-border mt-2">
              {topSelling.map((item, i) => (
                <div key={item.product!.id} className="flex items-center gap-3 py-2.5 px-1">
                  <span className="w-6 h-6 rounded-full bg-success/10 text-success text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product!.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product!.code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-success text-sm">{item.qty.toFixed(0)} uds</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Least Selling Chart */}
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
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={leastChartData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={36} />
                <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
                <Bar dataKey="qty" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {leastChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(var(--warning) / ${0.4 + i * 0.06})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="divide-y divide-border mt-2">
              {leastSelling.map((item, i) => (
                <div key={item.product!.id} className="flex items-center gap-3 py-2.5 px-1">
                  <span className="w-6 h-6 rounded-full bg-warning/10 text-warning text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product!.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product!.code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-warning text-sm">{item.qty.toFixed(0)} uds</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* No Sales */}
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
