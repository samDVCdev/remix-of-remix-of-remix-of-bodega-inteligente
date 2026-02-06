import { useState, useMemo } from "react";
import { X, Banknote, Coins, CreditCard, Smartphone, Trash2, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
type PaymentMethod = "cash_usd" | "cash_bs" | "card_bs" | "transfer_bs";
interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number; // always in original currency
  amountUsd: number; // converted to USD
  reference?: string;
}
interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  totalUsd: number;
  onConfirm: (payments: Payment[]) => void;
}
const methodConfig: Record<PaymentMethod, {
  label: string;
  shortLabel: string;
  icon: typeof Banknote;
  currency: "USD" | "BS";
}> = {
  cash_usd: {
    label: "EFECTIVO ($)",
    shortLabel: "EFECTIVO $",
    icon: Banknote,
    currency: "USD"
  },
  cash_bs: {
    label: "EFECTIVO (BS)",
    shortLabel: "EFECTIVO BS",
    icon: Coins,
    currency: "BS"
  },
  card_bs: {
    label: "TARJETA (BS)",
    shortLabel: "TARJETA BS",
    icon: CreditCard,
    currency: "BS"
  },
  transfer_bs: {
    label: "TRANSF. (BS)",
    shortLabel: "TRANSFERENCIA BS",
    icon: Smartphone,
    currency: "BS"
  }
};
export function PaymentModal({
  open,
  onClose,
  totalUsd,
  onConfirm
}: PaymentModalProps) {
  const {
    exchangeRate
  } = useCurrency();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash_usd");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const totalPaidUsd = useMemo(() => payments.reduce((sum, p) => sum + p.amountUsd, 0), [payments]);
  const remainingUsd = totalUsd - totalPaidUsd;
  const isFullyPaid = remainingUsd <= 0.005; // tolerance for floating point
  const change = remainingUsd < 0 ? Math.abs(remainingUsd) : 0;
  const config = methodConfig[selectedMethod];
  const isBs = config.currency === "BS";
  const handleAddPayment = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (selectedMethod === "transfer_bs" && !reference.trim()) {
      toast.error("El número de referencia es obligatorio para transferencias");
      return;
    }
    const amountUsd = isBs ? numAmount / exchangeRate : numAmount;
    const payment: Payment = {
      id: Date.now().toString(),
      method: selectedMethod,
      amount: numAmount,
      amountUsd,
      ...(selectedMethod === "transfer_bs" && {
        reference: reference.trim()
      })
    };
    setPayments(prev => [...prev, payment]);
    setAmount("");
    setReference("");
  };
  const handleRemovePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };
  const handleFinalize = () => {
    if (!isFullyPaid) return;
    onConfirm(payments);
    handleReset();
  };
  const handleReset = () => {
    setPayments([]);
    setAmount("");
    setReference("");
    setSelectedMethod("cash_usd");
  };
  const handleClose = () => {
    handleReset();
    onClose();
  };
  const formatBs = (usd: number) => (usd * exchangeRate).toFixed(1);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl mx-4 grid grid-cols-1 md:grid-cols-[1fr,1fr] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* LEFT COLUMN - Payment Input */}
        <div className="bg-card p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic text-foreground tracking-tight">PROCESAR COBRO</h2>
            <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Method Selector */}
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(methodConfig) as PaymentMethod[]).map(method => {
            const mc = methodConfig[method];
            const Icon = mc.icon;
            const isActive = selectedMethod === method;
            return <button key={method} onClick={() => setSelectedMethod(method)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold uppercase tracking-wide ${isActive ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30 text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] leading-tight text-center">{mc.label}</span>
                </button>;
          })}
          </div>

          {/* Amount Input Area */}
          <div className="border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Monto a abonar ({isBs ? "Bs" : "$"})
              </label>
              {remainingUsd > 0.005 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fillAmount = isBs ? remainingUsd * exchangeRate : remainingUsd;
                    setAmount(fillAmount.toFixed(2));
                  }}
                  className="text-xs h-7 px-3 font-bold uppercase tracking-wide border-primary text-primary hover:bg-primary/10"
                >
                  Pagar Completo
                </Button>
              )}
            </div>
            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="border-none shadow-none text-3xl font-black h-auto py-1 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40" min="0" step="0.01" />
            {selectedMethod === "transfer_bs" && <>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Número de Referencia
                </label>
                <Input type="text" placeholder="Ej: 4567" value={reference} onChange={e => setReference(e.target.value)} className="rounded-xl" />
              </>}

            <Button onClick={handleAddPayment} className="w-full rounded-2xl h-12 font-black text-sm uppercase tracking-wider">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pago
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN - Summary */}
        <div className="p-6 flex flex-col gap-4 border-l border-border bg-[sidebar-accent-foreground] bg-border">
          {/* Total */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Factura</p>
            <p className="text-4xl font-black text-foreground">
              ${totalUsd.toFixed(2)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                / {formatBs(totalUsd)} Bs
              </span>
            </p>
          </div>

          {/* Payments List */}
          <div className="flex-1 min-h-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Pagos Registrados
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {payments.length === 0 ? <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center">
                  <p className="text-muted-foreground/60 italic text-sm">No hay pagos registrados aún...</p>
                </div> : payments.map(p => {
              const mc = methodConfig[p.method];
              const Icon = mc.icon;
              return <div key={p.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase">{mc.shortLabel}</p>
                        {p.reference && <p className="text-[10px] text-primary font-medium">REF: {p.reference}</p>}
                      </div>
                      <p className="font-black text-sm">
                        {mc.currency === "USD" ? `$${p.amount.toFixed(2)}` : `${p.amount.toFixed(0)} Bs`}
                      </p>
                      <button onClick={() => handleRemovePayment(p.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>;
            })}
            </div>
          </div>

          {/* Remaining / Change */}
          <div className="border-t border-border pt-3">
            {change > 0 ? <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider italic text-muted-foreground">
                  Vuelto a entregar
                </p>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${change.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{formatBs(change)} Bs</p>
                </div>
              </div> : <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider italic text-muted-foreground">
                  Por Pagar / Restante
                </p>
                <div className="text-right">
                  <p className="text-2xl font-black text-destructive">${remainingUsd.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{formatBs(remainingUsd)} Bs</p>
                </div>
              </div>}
          </div>

          {/* Finalize */}
          <Button onClick={handleFinalize} disabled={!isFullyPaid} className="w-full rounded-2xl h-12 font-black text-sm uppercase tracking-wider" variant={isFullyPaid ? "default" : "secondary"}>
            {isFullyPaid && <CheckCircle className="w-4 h-4 mr-2" />}
            Finalizar Transacción
          </Button>
        </div>
      </div>
    </div>;
}
export type { Payment, PaymentMethod };