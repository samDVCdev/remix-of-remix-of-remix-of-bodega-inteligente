import { Clock } from "lucide-react";
import { InventoryMovement } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface ReportSalesHeatmapProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

export function ReportSalesHeatmap({ movements, isLoading }: ReportSalesHeatmapProps) {
  const { formatPrice } = useCurrency();

  const sales = movements.filter((m) => m.movement_type === "salida");

  // Count sales by hour using created_at
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
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

      {/* Heatmap bars */}
      <div className="stat-card">
        <h3 className="font-display font-semibold mb-4">Distribución de Ventas por Hora</h3>
        <div className="space-y-1.5">
          {hourData.map((h) => {
            const intensity = h.count / maxCount;
            return (
              <div key={h.hour} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12 text-right font-mono shrink-0">
                  {h.hour.toString().padStart(2, "0")}:00
                </span>
                <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded transition-all",
                      intensity > 0.7
                        ? "bg-primary"
                        : intensity > 0.4
                        ? "bg-primary/70"
                        : intensity > 0
                        ? "bg-primary/40"
                        : "bg-transparent"
                    )}
                    style={{ width: `${intensity * 100}%` }}
                  />
                  {h.count > 0 && (
                    <span className="absolute inset-y-0 right-2 flex items-center text-xs font-medium text-foreground">
                      {h.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right shrink-0 hidden sm:block">
                  {h.revenue > 0 ? formatPrice(h.revenue) : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
