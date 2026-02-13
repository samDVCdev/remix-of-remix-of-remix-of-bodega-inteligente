import { CreditCard, Users } from "lucide-react";
import { InventoryMovement } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ReportCreditsProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

export function ReportCredits({ movements, isLoading }: ReportCreditsProps) {
  const { formatPrice } = useCurrency();

  const creditMovements = movements.filter((m) => m.is_credit);

  const totalFiado = creditMovements.reduce((s, m) => s + Number(m.total_amount), 0);
  const totalPagado = creditMovements.reduce((s, m) => s + Number(m.amount_paid), 0);
  const totalPendiente = totalFiado - totalPagado;
  const paidPercentage = totalFiado > 0 ? (totalPagado / totalFiado) * 100 : 0;

  // Group by customer
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

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
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

      {/* Debtors List */}
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
                  <TableHead>Transacciones</TableHead>
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
