import { AlertTriangle } from "lucide-react";
import { Product } from "@/types/inventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  ReferenceLine,
} from "recharts";

interface ReportLowStockProps {
  products: Product[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold mb-1 text-foreground truncate max-w-[160px]">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ReportLowStock({ products, isLoading }: ReportLowStockProps) {
  const { formatPrice } = useCurrency();

  const lowStockProducts = products
    .filter((p) => Number(p.stock_base_units) <= Number(p.low_stock_threshold))
    .sort((a, b) => Number(a.stock_base_units) - Number(b.stock_base_units));

  // Prepare chart data — top 15
  const chartData = lowStockProducts.slice(0, 15).map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    fullName: p.name,
    stock: Number(p.stock_base_units),
    minimo: Number(p.low_stock_threshold),
  }));

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {lowStockProducts.length === 0 ? (
        <div className="stat-card p-0 overflow-hidden">
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-success/50 mb-4" />
            <p className="text-muted-foreground">Todos los productos tienen stock suficiente ✓</p>
          </div>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Stock Actual vs Mínimo</h3>
                <p className="text-xs text-muted-foreground">
                  {lowStockProducts.length} producto{lowStockProducts.length !== 1 ? "s" : ""} bajo el umbral
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 28)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="stock" name="Stock actual" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.stock === 0
                          ? "hsl(var(--destructive))"
                          : entry.stock <= entry.minimo * 0.5
                          ? "hsl(var(--destructive) / 0.7)"
                          : "hsl(var(--warning) / 0.8)"
                      }
                    />
                  ))}
                </Bar>
                <Bar dataKey="minimo" name="Mínimo" fill="hsl(var(--muted-foreground) / 0.25)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="stat-card p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-display font-semibold">
                  Productos con Stock Bajo ({lowStockProducts.length})
                </h3>
                <p className="text-xs text-muted-foreground">Productos cuyo stock está por debajo del umbral mínimo</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Precio Venta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell
                        className={
                          Number(p.stock_base_units) === 0
                            ? "text-destructive font-bold"
                            : "text-warning font-semibold"
                        }
                      >
                        {Number(p.stock_base_units).toFixed(0)} {p.base_unit}s
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {Number(p.low_stock_threshold).toFixed(0)}
                      </TableCell>
                      <TableCell>{formatPrice(Number(p.sale_price))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
