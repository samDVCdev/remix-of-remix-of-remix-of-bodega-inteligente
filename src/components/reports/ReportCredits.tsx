import { CreditCard, Users } from "lucide-react";
import { InventoryMovement } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface ReportCreditsProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label, formatPrice }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold mb-1 text-foreground truncate max-w-[160px]">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{formatPrice(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ReportCredits({ movements, isLoading }: ReportCreditsProps) {
  const { formatPrice } = useCurrency();

  const creditMovements = movements.filter((m) => m.is_credit);

  const totalFiado = creditMovements.reduce((s, m) => s + Number(m.total_amount), 0);
  const totalPagado = creditMovements.reduce((s, m) => s + Number(m.amount_paid), 0);
  const totalPendiente = totalFiado - totalPagado;
  const paidPercentage = totalFiado > 0 ? (totalPagado / totalFiado) * 100 : 0;

  const debtorMap = new Map<string, { total: number; paid: number; count: number }>();
  creditMovements.forEach((m) => {
    const name = m.customer_name || "Sin nombre";
    const existing = debtorMap.get(name) || { total: 0, paid: 0, count: 0 };
    existing.total += Number(m.total_amount);
    existing.paid += Number(m.amount_paid);
    existing.count++;
    debtorMap.set(name, existing);
  });

  const debtors = Array.from(debtorMap.entries())
    .map(([name, data]) => ({
      name,
      ...data,
      due: data.total - data.paid,
    }))
    .filter((d) => d.due > 0.01)
    .sort((a, b) => b.due - a.due);

  // Chart data — top 10 debtors
  const chartData = debtors.slice(0, 10).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
    fullName: d.name,
    Pendiente: parseFloat(d.due.toFixed(2)),
    Pagado: parseFloat(d.paid.toFixed(2)),
  }));

  // Summary bar data
  const summaryData = [
    { name: "Total Fiado", valor: parseFloat(totalFiado.toFixed(2)), fill: "hsl(var(--primary))" },
    { name: "Pagado", valor: parseFloat(totalPagado.toFixed(2)), fill: "hsl(var(--success))" },
    { name: "Pendiente", valor: parseFloat(totalPendiente.toFixed(2)), fill: "hsl(var(--destructive))" },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card bg-primary/5 border-primary/20">
          <p className="text-sm font-medium text-muted-foreground">Total Fiado</p>
          <p className="text-xl sm:text-2xl font-display font-bold text-primary">{formatPrice(totalFiado)}</p>
        </div>
        <div className="stat-card bg-success/5 border-success/20">
          <p className="text-sm font-medium text-muted-foreground">Total Pagado</p>
          <p className="text-xl sm:text-2xl font-display font-bold text-success">{formatPrice(totalPagado)}</p>
          <Progress value={paidPercentage} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">{paidPercentage.toFixed(1)}% recuperado</p>
        </div>
        <div className="stat-card bg-destructive/5 border-destructive/20">
          <p className="text-sm font-medium text-muted-foreground">Pendiente por Cobrar</p>
          <p className="text-xl sm:text-2xl font-display font-bold text-destructive">{formatPrice(totalPendiente)}</p>
        </div>
      </div>

      {/* Summary Bar Chart */}
      {totalFiado > 0 && (
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Resumen de Fiados (USD)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summaryData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={56}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Monto"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={80}>
                {summaryData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Debtors Bar Chart */}
      {debtors.length > 0 && (
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Top Deudores — Fiado vs Pagado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={56}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
              />
              <Bar dataKey="Pagado" fill="hsl(var(--success) / 0.8)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Pendiente" fill="hsl(var(--destructive) / 0.8)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Debtors Table */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Users className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Deudores Activos ({debtors.length})</h3>
            <p className="text-xs text-muted-foreground">Clientes con saldo pendiente</p>
          </div>
        </div>
        {debtors.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay deudas pendientes ✓</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fiado</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Trans.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtors.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{formatPrice(d.total)}</TableCell>
                    <TableCell className="text-success">{formatPrice(d.paid)}</TableCell>
                    <TableCell className="text-destructive font-semibold">{formatPrice(d.due)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
