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
  amountUsd: number;
  amountBs: number;
  count: number;
  colorClass: string;
  isUsd: boolean;
}

export function ReportPaymentMethods({ movements, isLoading }: ReportPaymentMethodsProps) {
  const { exchangeRate } = useCurrency();

  const sales = movements.filter((m) => m.movement_type === "salida");

  // Parse payment methods from notes
  // Actual format: "Efectivo $: $5.00 | Tarjeta Bs: $7.50 | Transferencia Bs: $0.40 (Ref: 123)"
  // Also: "Efectivo Bs: Bs182.5"
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

    // Patterns matching real format
    const patterns = [
      { key: "Efectivo $", regex: /Efectivo\s*\$[:\s]*\$?([\d,.]+)/i, isUsd: true },
      { key: "Efectivo Bs", regex: /Efectivo\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i, isUsd: false },
      { key: "Tarjeta Bs", regex: /Tarjeta\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i, isUsd: false },
      { key: "Transferencia Bs", regex: /Transferencia\s*Bs[:\s]*(?:Bs\.?\s?)?\$?([\d,.]+)/i, isUsd: false },
    ];

    patterns.forEach(({ key, regex, isUsd }) => {
      const match = notes.match(regex);
      if (match) {
        const val = parseFloat(match[1].replace(",", "."));
        if (val > 0) {
          if (isUsd) {
            methods[key].amountUsd += val;
            methods[key].amountBs += val * exchangeRate;
          } else {
            // Values in notes for BS methods are stored as USD equivalent (from PaymentModal amountUsd)
            // Actually looking at the data: "Tarjeta Bs: $7.50" - the $ sign means it's USD
            methods[key].amountUsd += val;
            methods[key].amountBs += val * exchangeRate;
          }
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
      isUsd: true,
    },
    {
      label: "Efectivo VES",
      icon: <Banknote className="w-5 h-5" />,
      amountUsd: methods["Efectivo Bs"].amountUsd,
      amountBs: methods["Efectivo Bs"].amountBs,
      count: methods["Efectivo Bs"].count,
      colorClass: "bg-primary/10 text-primary",
      isUsd: false,
    },
    {
      label: "Tarjeta",
      icon: <CreditCard className="w-5 h-5" />,
      amountUsd: methods["Tarjeta Bs"].amountUsd,
      amountBs: methods["Tarjeta Bs"].amountBs,
      count: methods["Tarjeta Bs"].count,
      colorClass: "bg-accent/50 text-accent-foreground",
      isUsd: false,
    },
    {
      label: "Transferencia / Pago Móvil",
      icon: <Smartphone className="w-5 h-5" />,
      amountUsd: methods["Transferencia Bs"].amountUsd,
      amountBs: methods["Transferencia Bs"].amountBs,
      count: methods["Transferencia Bs"].count,
      colorClass: "bg-warning/10 text-warning",
      isUsd: false,
    },
  ];

  if (methods["Sin detalle"].count > 0) {
    methodConfigs.push({
      label: "Sin detalle de método",
      icon: <Banknote className="w-5 h-5" />,
      amountUsd: methods["Sin detalle"].amountUsd,
      amountBs: methods["Sin detalle"].amountBs,
      count: methods["Sin detalle"].count,
      colorClass: "bg-muted text-muted-foreground",
      isUsd: false,
    });
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
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
                  className="h-full rounded-full bg-primary/50"
                  style={{ width: `${percentage}%` }}
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
