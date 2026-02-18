import { Banknote, CreditCard, Smartphone, DollarSign } from "lucide-react";
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
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface ReportPaymentMethodsProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

interface PaymentBreakdown {
  label: string;
  icon: React.ReactNode;
  amountUsd: number;
  amountBs: number;
  count: number;
  colorClass: string;
  barColor: string;
  isUsd: boolean;
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold mb-1 text-foreground">{payload[0]?.name}</p>
        <p className="text-muted-foreground">
          Monto: <span className="font-bold text-foreground">${payload[0]?.value?.toFixed(2)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ReportPaymentMethods({ movements, isLoading }: ReportPaymentMethodsProps) {
  const { exchangeRate } = useCurrency();

  const sales = movements.filter((m) => m.movement_type === "salida");

  const methods: Record<string, { amountUsd: number; amountBs: number; count: number }> = {
    "Efectivo $": { amountUsd: 0, amountBs: 0, count: 0 },
    "Efectivo Bs": { amountUsd: 0, amountBs: 0, count: 0 },
    "Tarjeta Bs": { amountUsd: 0, amountBs: 0, count: 0 },
    "Transferencia Bs": { amountUsd: 0, amountBs: 0, count: 0 },
    "Sin detalle": { amountUsd: 0, amountBs: 0, count: 0 },
  };

  sales.forEach((s) => {
    const notes = s.notes || "";
    let matched = false;
    const patterns = [
      { key: "Efectivo $", regex: /Efectivo\s*\$[:\s]*\$?([\d,.]+)/i, isUsd: true },
      { key: "Efectivo Bs", regex: /Efectivo\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i, isUsd: false },
      { key: "Tarjeta Bs", regex: /Tarjeta\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i, isUsd: false },
      { key: "Transferencia Bs", regex: /Transferencia\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i, isUsd: false },
    ];
    patterns.forEach(({ key, regex }) => {
      const match = notes.match(regex);
      if (match) {
        const val = parseFloat(match[1].replace(",", "."));
        if (val > 0) {
          methods[key].amountUsd += val;
          methods[key].amountBs += val * exchangeRate;
          methods[key].count++;
          matched = true;
        }
      }
    });
    if (!matched) {
      const amt = Number(s.total_amount);
      methods["Sin detalle"].amountUsd += amt;
      methods["Sin detalle"].amountBs += amt * exchangeRate;
      methods["Sin detalle"].count++;
    }
  });

  const totalUsd = Object.values(methods).reduce((s, m) => s + m.amountUsd, 0);

  const methodConfigs: PaymentBreakdown[] = [
    {
      label: "Efectivo USD",
      icon: <DollarSign className="w-5 h-5" />,
      amountUsd: methods["Efectivo $"].amountUsd,
      amountBs: methods["Efectivo $"].amountBs,
      count: methods["Efectivo $"].count,
      colorClass: "bg-success/10 text-success",
      barColor: "hsl(var(--success))",
      isUsd: true,
    },
    {
      label: "Efectivo VES",
      icon: <Banknote className="w-5 h-5" />,
      amountUsd: methods["Efectivo Bs"].amountUsd,
      amountBs: methods["Efectivo Bs"].amountBs,
      count: methods["Efectivo Bs"].count,
      colorClass: "bg-primary/10 text-primary",
      barColor: "hsl(var(--primary))",
      isUsd: false,
    },
    {
      label: "Tarjeta",
      icon: <CreditCard className="w-5 h-5" />,
      amountUsd: methods["Tarjeta Bs"].amountUsd,
      amountBs: methods["Tarjeta Bs"].amountBs,
      count: methods["Tarjeta Bs"].count,
      colorClass: "bg-accent/50 text-accent-foreground",
      barColor: "hsl(var(--accent-foreground) / 0.6)",
      isUsd: false,
    },
    {
      label: "Transferencia",
      icon: <Smartphone className="w-5 h-5" />,
      amountUsd: methods["Transferencia Bs"].amountUsd,
      amountBs: methods["Transferencia Bs"].amountBs,
      count: methods["Transferencia Bs"].count,
      colorClass: "bg-warning/10 text-warning",
      barColor: "hsl(var(--warning))",
      isUsd: false,
    },
  ];

  if (methods["Sin detalle"].count > 0) {
    methodConfigs.push({
      label: "Sin detalle",
      icon: <Banknote className="w-5 h-5" />,
      amountUsd: methods["Sin detalle"].amountUsd,
      amountBs: methods["Sin detalle"].amountBs,
      count: methods["Sin detalle"].count,
      colorClass: "bg-muted text-muted-foreground",
      barColor: "hsl(var(--muted-foreground) / 0.5)",
      isUsd: false,
    });
  }

  const activeMethodConfigs = methodConfigs.filter((m) => m.amountUsd > 0);

  const barChartData = methodConfigs.map((m) => ({
    name: m.label,
    monto: parseFloat(m.amountUsd.toFixed(2)),
    transacciones: m.count,
    fill: m.barColor,
  }));

  const pieData = activeMethodConfigs.map((m) => ({
    name: m.label,
    value: parseFloat(m.amountUsd.toFixed(2)),
    fill: m.barColor,
  }));

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {methodConfigs.map((method) => {
          const percentage = totalUsd > 0 ? (method.amountUsd / totalUsd) * 100 : 0;
          return (
            <div key={method.label} className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${method.colorClass}`}>
                  {method.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.count} transacciones</p>
                </div>
              </div>
              <p className="text-xl font-display font-bold">${method.amountUsd.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Bs. {method.amountBs.toFixed(2)}</p>
              <div className="mt-2 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50 transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% del total</p>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="stat-card">
        <h3 className="font-display font-semibold mb-4">Monto por Método de Pago (USD)</h3>
        {totalUsd === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay ventas con método de pago detallado</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={52}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {barChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Distribución de Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => [`$${val.toFixed(2)}`, "Monto"]} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
