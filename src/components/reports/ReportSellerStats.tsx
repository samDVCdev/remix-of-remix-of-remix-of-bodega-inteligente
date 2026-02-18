import { Users, ShoppingCart, DollarSign, Package } from "lucide-react";
import { InventoryMovement } from "@/types/inventory";
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

interface ReportSellerStatsProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(142 71% 45%)",
  "hsl(200 80% 50%)",
  "hsl(280 65% 55%)",
];

const CustomTooltip = ({ active, payload, label, formatPrice }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-muted-foreground">
            {p.name}:{" "}
            <span className="font-bold text-foreground">
              {p.dataKey === "revenue" ? formatPrice(p.value) : p.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ReportSellerStats({ movements, isLoading }: ReportSellerStatsProps) {
  const { formatPrice } = useCurrency();

  // Only sales (salida)
  const sales = movements.filter((m) => m.movement_type === "salida");

  // Group by seller
  const bySeller: Record<string, { name: string; sales: number; revenue: number; products: Record<string, { name: string; qty: number; revenue: number }> }> = {};

  sales.forEach((m) => {
    const key = m.sold_by || "__unknown__";
    const name = (m as any).seller_name || m.sold_by || "Sin asignar";
    if (!bySeller[key]) {
      bySeller[key] = { name, sales: 0, revenue: 0, products: {} };
    }
    bySeller[key].sales += 1;
    bySeller[key].revenue += Number(m.total_amount);

    // Track products per seller
    const pId = m.product_id;
    const pName = (m as any).product?.name || "Desconocido";
    if (!bySeller[key].products[pId]) {
      bySeller[key].products[pId] = { name: pName, qty: 0, revenue: 0 };
    }
    bySeller[key].products[pId].qty += Number(m.quantity);
    bySeller[key].products[pId].revenue += Number(m.total_amount);
  });

  // Also pull seller_name from movements that have sold_by
  // Override name with profile if available via notes
  const sellerList = Object.entries(bySeller)
    .map(([, data]) => data)
    .sort((a, b) => b.revenue - a.revenue);

  const chartSales = sellerList.map((s) => ({
    name: s.name.length > 16 ? s.name.slice(0, 16) + "…" : s.name,
    fullName: s.name,
    ventas: s.sales,
    revenue: s.revenue,
  }));

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  if (sellerList.length === 0) {
    return (
      <div className="stat-card p-12 text-center">
        <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">No hay ventas registradas en este período</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card bg-primary/5 border-primary/20">
          <p className="text-xs text-muted-foreground">Vendedores activos</p>
          <p className="text-2xl font-display font-bold text-primary">{sellerList.length}</p>
        </div>
        <div className="stat-card bg-success/5 border-success/20">
          <p className="text-xs text-muted-foreground">Total transacciones</p>
          <p className="text-2xl font-display font-bold text-success">{sales.length}</p>
        </div>
        <div className="stat-card bg-warning/5 border-warning/20">
          <p className="text-xs text-muted-foreground">Mayor vendedor</p>
          <p className="text-sm font-display font-bold text-warning truncate">{sellerList[0]?.name}</p>
          <p className="text-xs text-muted-foreground">{sellerList[0]?.sales} ventas</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Mayor recaudación</p>
          <p className="text-sm font-display font-bold text-foreground truncate">{sellerList[0]?.name}</p>
          <p className="text-xs text-muted-foreground">{formatPrice(sellerList[0]?.revenue)}</p>
        </div>
      </div>

      {/* Bar chart: Ventas por vendedor */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Cantidad de Ventas por Vendedor</h3>
            <p className="text-xs text-muted-foreground">Número de transacciones realizadas</p>
          </div>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartSales} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={36} allowDecimals={false} />
              <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
              <Bar dataKey="ventas" name="Ventas" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {chartSales.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart: Ingresos por vendedor */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <DollarSign className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Ingresos por Vendedor</h3>
            <p className="text-xs text-muted-foreground">Monto total recaudado en el período</p>
          </div>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartSales} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={60} />
              <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
              <Bar dataKey="revenue" name="Ingresos ($)" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {chartSales.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--success) / ${0.5 + (i * 0.1 > 0.5 ? 0.5 : i * 0.1)})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed table per seller */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Package className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Detalle por Vendedor</h3>
            <p className="text-xs text-muted-foreground">Productos más vendidos por cada usuario</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {sellerList.map((seller, si) => {
            const topProducts = Object.values(seller.products)
              .sort((a, b) => b.qty - a.qty)
              .slice(0, 5);

            return (
              <div key={si} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: COLORS[si % COLORS.length] }}
                    >
                      {seller.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{seller.name}</p>
                      <p className="text-xs text-muted-foreground">{seller.sales} ventas · {formatPrice(seller.revenue)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {topProducts.map((p, pi) => (
                    <div
                      key={pi}
                      className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(p.revenue)}</p>
                      </div>
                      <span
                        className="text-xs font-bold ml-2 shrink-0 px-2 py-0.5 rounded-full"
                        style={{
                          background: `${COLORS[si % COLORS.length]}22`,
                          color: COLORS[si % COLORS.length],
                        }}
                      >
                        {p.qty.toFixed(0)} uds
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
