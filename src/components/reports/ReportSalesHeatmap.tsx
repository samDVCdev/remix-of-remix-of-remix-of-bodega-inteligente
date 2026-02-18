import { Clock } from "lucide-react";
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

interface ReportSalesHeatmapProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label, formatPrice }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold mb-1 text-foreground">
          {label}:00 – {parseInt(label) + 1}:00
        </p>
        <p className="text-muted-foreground">
          Ventas: <span className="font-bold text-foreground">{payload[0]?.value}</span>
        </p>
        {payload[1] && (
          <p className="text-muted-foreground">
            Ingresos: <span className="font-bold text-primary">{formatPrice(payload[1]?.value)}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function ReportSalesHeatmap({ movements, isLoading }: ReportSalesHeatmapProps) {
  const { formatPrice } = useCurrency();

  const sales = movements.filter((m) => m.movement_type === "salida");

  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: i.toString().padStart(2, "0"),
    count: 0,
    revenue: 0,
  }));

  sales.forEach((s) => {
    const hour = new Date(s.created_at).getHours();
    hourData[hour].count++;
    hourData[hour].revenue += Number(s.total_amount);
  });

  const maxCount = Math.max(...hourData.map((h) => h.count), 1);
  const peakHour = hourData.reduce((best, h) => (h.count > best.count ? h : best), hourData[0]);

  // Only show hours 6–23 by default to reduce noise, but keep all
  const activeHours = hourData.filter((h) => h.count > 0);
  const hasData = activeHours.length > 0;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Peak hour card */}
      <div className="stat-card bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Hora Pico de Ventas</p>
            <p className="text-xl font-display font-bold text-primary">
              {peakHour.count > 0
                ? `${peakHour.hour.toString().padStart(2, "0")}:00 - ${(peakHour.hour + 1).toString().padStart(2, "0")}:00`
                : "Sin datos"}
            </p>
            {peakHour.count > 0 && (
              <p className="text-xs text-muted-foreground">
                {peakHour.count} ventas · {formatPrice(peakHour.revenue)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="stat-card">
        <h3 className="font-display font-semibold mb-4">Ventas por Hora del Día</h3>
        {!hasData ? (
          <div className="p-8 text-center text-muted-foreground">No hay datos de ventas en el período</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={30}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {hourData.map((h, i) => {
                  const intensity = h.count / maxCount;
                  const opacity = intensity > 0
                    ? Math.max(0.3, intensity)
                    : 0.08;
                  return (
                    <Cell
                      key={i}
                      fill={h.hour === peakHour.hour && peakHour.count > 0
                        ? "hsl(var(--primary))"
                        : `hsl(var(--primary) / ${opacity})`
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue by Hour Chart */}
      {hasData && (
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Ingresos por Hora del Día</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={50}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {hourData.map((h, i) => (
                  <Cell
                    key={i}
                    fill={h.revenue > 0 ? "hsl(var(--success) / 0.7)" : "hsl(var(--muted) / 0.3)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
