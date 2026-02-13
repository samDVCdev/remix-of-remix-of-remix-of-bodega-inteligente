import { Banknote, CreditCard, Smartphone, DollarSign } from "lucide-react";
import { InventoryMovement } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";

interface ReportPaymentMethodsProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

interface PaymentBreakdown {
  label: string;
  icon: React.ReactNode;
  amount: number;
  count: number;
  colorClass: string;
}

export function ReportPaymentMethods({ movements, isLoading }: ReportPaymentMethodsProps) {
  const { formatPrice } = useCurrency();

  const sales = movements.filter((m) => m.movement_type === "salida");

  // Parse payment methods from notes
  // Notes format includes things like: "Efectivo USD: $X.XX | Efectivo VES: BsX.XX | Tarjeta: BsX.XX | Transferencia: BsX.XX (Ref: ...)"
  const methods: Record<string, { amount: number; count: number }> = {
    "Efectivo USD": { amount: 0, count: 0 },
    "Efectivo VES": { amount: 0, count: 0 },
    Tarjeta: { amount: 0, count: 0 },
    Transferencia: { amount: 0, count: 0 },
    "Sin detalle": { amount: 0, count: 0 },
  };

  sales.forEach((s) => {
    const notes = s.notes || "";
    let matched = false;

    // Try to parse payment breakdown from notes
    const patterns = [
      { key: "Efectivo USD", regex: /Efectivo USD[:\s]*\$?([\d,.]+)/i },
      { key: "Efectivo VES", regex: /Efectivo VES[:\s]*(?:Bs\.?\s?)?([\d,.]+)/i },
      { key: "Tarjeta", regex: /Tarjeta[:\s]*(?:Bs\.?\s?)?([\d,.]+)/i },
      { key: "Transferencia", regex: /Transferencia[:\s]*(?:Bs\.?\s?)?([\d,.]+)/i },
    ];

    patterns.forEach(({ key, regex }) => {
      const match = notes.match(regex);
      if (match) {
        const val = parseFloat(match[1].replace(",", "."));
        if (val > 0) {
          // For VES methods, we need the USD equivalent - approximate with total_amount proportion
          // Since we can't know exact rate, we'll count them separately
          methods[key].amount += key === "Efectivo USD" ? val : val;
          methods[key].count++;
          matched = true;
        }
      }
    });

    if (!matched) {
      methods["Sin detalle"].amount += Number(s.total_amount);
      methods["Sin detalle"].count++;
    }
  });

  const totalRevenue = Object.values(methods).reduce((s, m) => s + m.amount, 0);

  const methodConfigs: PaymentBreakdown[] = [
    {
      label: "Efectivo USD",
      icon: <DollarSign className="w-5 h-5" />,
      amount: methods["Efectivo USD"].amount,
      count: methods["Efectivo USD"].count,
      colorClass: "bg-success/10 text-success",
    },
    {
      label: "Efectivo VES",
      icon: <Banknote className="w-5 h-5" />,
      amount: methods["Efectivo VES"].amount,
      count: methods["Efectivo VES"].count,
      colorClass: "bg-primary/10 text-primary",
    },
    {
      label: "Tarjeta",
      icon: <CreditCard className="w-5 h-5" />,
      amount: methods["Tarjeta"].amount,
      count: methods["Tarjeta"].count,
      colorClass: "bg-accent/50 text-accent-foreground",
    },
    {
      label: "Transferencia / Pago Móvil",
      icon: <Smartphone className="w-5 h-5" />,
      amount: methods["Transferencia"].amount,
      count: methods["Transferencia"].count,
      colorClass: "bg-warning/10 text-warning",
    },
  ];

  // Only show "Sin detalle" if there are some
  if (methods["Sin detalle"].count > 0) {
    methodConfigs.push({
      label: "Sin detalle de método",
      icon: <Banknote className="w-5 h-5" />,
      amount: methods["Sin detalle"].amount,
      count: methods["Sin detalle"].count,
      colorClass: "bg-muted text-muted-foreground",
    });
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {methodConfigs.map((method) => {
          const percentage = totalRevenue > 0 ? (method.amount / totalRevenue) * 100 : 0;
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
              <p className="text-xl font-display font-bold">
                {method.label === "Efectivo USD"
                  ? `$${method.amount.toFixed(2)}`
                  : method.label.includes("VES") || method.label === "Tarjeta" || method.label.includes("Transferencia")
                  ? `Bs. ${method.amount.toFixed(2)}`
                  : formatPrice(method.amount)}
              </p>
              <div className="mt-2 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${method.colorClass.replace("/10", "/50").replace("text-", "bg-")}`}
                  style={{ width: `${percentage}%`, backgroundColor: undefined }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% del total</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
