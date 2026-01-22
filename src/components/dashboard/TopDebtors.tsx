import { CreditCard } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface DebtorInfo {
  customer_name: string;
  total_debt: number;
  amount_paid: number;
  debt_percentage: number;
}

interface TopDebtorsProps {
  debtors: DebtorInfo[];
}

export function TopDebtors({ debtors }: TopDebtorsProps) {
  const { formatPrice } = useCurrency();

  if (debtors.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10">
            <CreditCard className="w-5 h-5 text-success" />
          </div>
          <h3 className="font-display font-semibold text-foreground">Deudores</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No hay cuentas pendientes
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-warning/10">
          <CreditCard className="w-5 h-5 text-warning" />
        </div>
        <h3 className="font-display font-semibold text-foreground">
          Top Deudores ({debtors.length})
        </h3>
      </div>
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {debtors.slice(0, 5).map((debtor, index) => (
          <div
            key={`${debtor.customer_name}-${index}`}
            className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-foreground truncate">
                {debtor.customer_name || "Sin nombre"}
              </p>
              <p className="text-xs text-muted-foreground">
                Pagado: {formatPrice(debtor.amount_paid)}
              </p>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="font-semibold text-warning text-sm">
                {formatPrice(debtor.total_debt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {debtor.debt_percentage.toFixed(0)}% pendiente
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
