import { useState, useMemo } from "react";
import { CreditCard, Search, DollarSign, Package, X, Banknote, Coins, CreditCard as CreditCardIcon, Smartphone, Trash2, Plus, CheckCircle, Eye, Loader2, CalendarDays } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { TablePagination } from "@/components/ui/table-pagination";
import type { Payment } from "@/components/pos/PaymentModal";
import { useGroupedAccountsReceivable, useRegisterGroupPayment, GroupedAccount } from "@/hooks/useAccountsReceivable";
import { usePagination } from "@/hooks/usePagination";
import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function AccountsReceivablePage() {
  const [search, setSearch] = useState("");
  const [paymentGroup, setPaymentGroup] = useState<GroupedAccount | null>(null);
  const [viewingGroup, setViewingGroup] = useState<GroupedAccount | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { data: groupedAccounts, isLoading } = useGroupedAccountsReceivable();
  const registerPayment = useRegisterGroupPayment();
  const { formatPrice, exchangeRate } = useCurrency();

  const dualPrice = (usd: number) => `$${usd.toFixed(2)} / Bs. ${(usd * exchangeRate).toFixed(2)}`;

  const filteredAccounts = groupedAccounts?.filter(
    (g) => {
      const matchesSearch = g.customerName.toLowerCase().includes(search.toLowerCase()) ||
        g.items.some(item => item.product_name?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = showPaid ? true : !g.isPaid;
      
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(g.movementDate) >= new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(g.movementDate) <= end;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    }
  );

  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
  } = usePagination(filteredAccounts, { initialItemsPerPage: 10 });

  const totalPending = groupedAccounts?.filter(g => !g.isPaid).reduce((sum, g) => sum + g.amountDue, 0) || 0;

  const handlePaymentConfirm = async (payments: Payment[]) => {
    if (!paymentGroup) return;
    const totalPaidUsd = payments.reduce((sum, p) => sum + p.amountUsd, 0);
    
    // Build notes from payment methods
    const methodLabels: Record<string, string> = {
      cash_usd: "Efectivo $",
      cash_bs: "Efectivo Bs",
      card_bs: "Tarjeta Bs",
      transfer_bs: "Transferencia Bs",
    };
    const noteParts = payments.map(p => {
      let note = `${methodLabels[p.method]}: $${p.amountUsd.toFixed(2)}`;
      if (p.reference) note += ` (Ref: ${p.reference})`;
      return note;
    });
    const notes = noteParts.join(" | ");

    const accountIds = paymentGroup.items.map(item => item.id);

    await registerPayment.mutateAsync({
      accountIds,
      totalAmount: totalPaidUsd,
      notes,
    });
    setPaymentGroup(null);
  };

  const getPaymentProgress = (group: GroupedAccount) => {
    return group.totalAmount > 0 ? (group.amountPaid / group.totalAmount) * 100 : 0;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Cuentas por Cobrar</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Ventas fiadas pendientes de pago</p>
          </div>
          <div className="stat-card p-3 sm:p-4 bg-amber-500/10 border-amber-500/20">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Pendiente</p>
            <p className="text-lg sm:text-xl font-display font-bold text-amber-500 truncate">
              ${totalPending.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Bs. {(totalPending * exchangeRate).toFixed(2)}</p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente o producto..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <div className="flex gap-2 items-center">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[140px]" />
              <span className="text-muted-foreground text-sm">-</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[140px]" />
            </div>
            <Button
              variant={showPaid ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPaid(!showPaid)}
              className="gap-1.5 shrink-0"
            >
              <Eye className="w-4 h-4" />
              {showPaid ? "Ocultar Pagadas" : "Ver Pagadas"}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : filteredAccounts?.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay cuentas pendientes</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden sm:table-cell">Productos</TableHead>
                      <TableHead className="hidden lg:table-cell">Progreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.map((group) => {
                      const progress = getPaymentProgress(group);
                      
                      return (
                        <TableRow key={group.groupId} className={group.isPaid ? "opacity-60" : ""}>
                          <TableCell className="text-xs">
                            {format(new Date(group.movementDate), "dd MMM", { locale: es })}
                          </TableCell>
                          <TableCell className="font-medium max-w-[100px] truncate">
                            {group.customerName}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {group.items.length === 1 
                                  ? group.items[0].product_name 
                                  : `${group.items.length} productos`}
                              </span>
                              {group.items.length > 1 && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                                  {group.items.length}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="space-y-1">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {dualPrice(group.amountPaid)} de {dualPrice(group.totalAmount)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {group.isPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" /> Pagada
                              </span>
                            ) : (
                              <div>
                                <p className="font-semibold text-amber-500 text-sm">${group.amountDue.toFixed(2)}</p>
                                <p className="text-[10px] text-muted-foreground">Bs. {(group.amountDue * exchangeRate).toFixed(2)}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setViewingGroup(group)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Ver historial"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!group.isPaid && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setPaymentGroup(group)}
                                  className="gap-1 text-primary border-primary hover:bg-primary/10 px-2"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  <span className="hidden sm:inline">Abonar</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {totalItems > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={onPageChange}
                  onItemsPerPageChange={onItemsPerPageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal with Product Details */}
      {paymentGroup && (
        <PaymentModalWithDetails
          open={!!paymentGroup}
          onClose={() => setPaymentGroup(null)}
          group={paymentGroup}
          onConfirm={handlePaymentConfirm}
          isLoading={registerPayment.isPending}
        />
      )}

      {/* Payment History Dialog */}
      {viewingGroup && (
        <PaymentHistoryDialog
          group={viewingGroup}
          onClose={() => setViewingGroup(null)}
        />
      )}
    </MainLayout>
  );
}

// Extended PaymentModal that shows product details
function PaymentModalWithDetails({
  open,
  onClose,
  group,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  group: GroupedAccount;
  onConfirm: (payments: Payment[]) => void;
  isLoading?: boolean;
}) {
  const { exchangeRate } = useCurrency();
  const dualPrice = (usd: number) => `$${usd.toFixed(2)} / Bs. ${(usd * exchangeRate).toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-4xl mx-4 grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* LEFT - Product Details */}
        <div className="bg-card p-6 border-r border-border overflow-y-auto">
          <h3 className="text-lg font-bold mb-1">{group.customerName}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {format(new Date(group.movementDate), "dd 'de' MMMM, yyyy", { locale: es })}
          </p>
          
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Detalle de Productos
          </p>
          
          <div className="space-y-2">
            {group.items.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-card border border-border">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Cantidad: {Number(item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">${Number(item.total_amount).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Bs. {(Number(item.total_amount) * exchangeRate).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Pagado: ${Number(item.amount_paid || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Compra:</span>
              <span className="font-bold">{dualPrice(group.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ya Pagado:</span>
              <span className="font-medium text-primary">{dualPrice(group.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-base mt-2 pt-2 border-t border-border">
              <span className="font-semibold">Saldo Pendiente:</span>
              <span className="font-bold text-amber-500">{dualPrice(group.amountDue)}</span>
            </div>
          </div>
        </div>
        
        {/* RIGHT - Payment Modal Content */}
        <InlinePaymentForm 
          totalUsd={group.amountDue}
          onClose={onClose}
          onConfirm={onConfirm}
          exchangeRate={exchangeRate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

// Inline payment form (extracted from PaymentModal)

type PaymentMethod = "cash_usd" | "cash_bs" | "card_bs" | "transfer_bs";

interface LocalPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  amountUsd: number;
  reference?: string;
}

const methodConfig: Record<PaymentMethod, {
  label: string;
  shortLabel: string;
  icon: typeof Banknote;
  currency: "USD" | "BS";
}> = {
  cash_usd: { label: "EFECTIVO ($)", shortLabel: "EFECTIVO $", icon: Banknote, currency: "USD" },
  cash_bs: { label: "EFECTIVO (BS)", shortLabel: "EFECTIVO BS", icon: Coins, currency: "BS" },
  card_bs: { label: "TARJETA (BS)", shortLabel: "TARJETA BS", icon: CreditCardIcon, currency: "BS" },
  transfer_bs: { label: "TRANSF. (BS)", shortLabel: "TRANSFERENCIA BS", icon: Smartphone, currency: "BS" },
};

function InlinePaymentForm({
  totalUsd,
  onClose,
  onConfirm,
  exchangeRate,
  isLoading,
}: {
  totalUsd: number;
  onClose: () => void;
  onConfirm: (payments: Payment[]) => void;
  exchangeRate: number;
  isLoading?: boolean;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash_usd");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [payments, setPayments] = useState<LocalPayment[]>([]);

  const totalPaidUsd = useMemo(() => payments.reduce((sum, p) => sum + p.amountUsd, 0), [payments]);
  const remainingUsd = totalUsd - totalPaidUsd;
  const isFullyPaid = remainingUsd <= 0.005;
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
    const payment: LocalPayment = {
      id: Date.now().toString(),
      method: selectedMethod,
      amount: numAmount,
      amountUsd,
      ...(selectedMethod === "transfer_bs" && { reference: reference.trim() }),
    };
    setPayments(prev => [...prev, payment]);
    setAmount("");
    setReference("");
  };

  const handleRemovePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleFinalize = () => {
    if (payments.length === 0) {
      toast.error("Registra al menos un pago");
      return;
    }
    onConfirm(payments as Payment[]);
  };

  const formatBs = (usd: number) => (usd * exchangeRate).toFixed(1);

  return (
    <div className="bg-card p-6 flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black italic text-foreground tracking-tight">PROCESAR COBRO</h2>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Total Display */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total a Cobrar</p>
        <p className="text-3xl font-black text-foreground">
          ${totalUsd.toFixed(2)}{" "}
          <span className="text-base font-normal text-muted-foreground">/ {formatBs(totalUsd)} Bs</span>
        </p>
      </div>

      {/* Method Selector */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(methodConfig) as PaymentMethod[]).map(method => {
          const mc = methodConfig[method];
          const Icon = mc.icon;
          const isActive = selectedMethod === method;
          return (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold uppercase tracking-wide ${
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight text-center">{mc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Amount Input */}
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
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border-none shadow-none text-2xl font-black h-auto py-1 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40"
          min="0"
          step="0.01"
        />
        {selectedMethod === "transfer_bs" && (
          <>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Número de Referencia
            </label>
            <Input
              type="text"
              placeholder="Ej: 4567"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="rounded-xl"
            />
          </>
        )}
        <Button onClick={handleAddPayment} className="w-full rounded-2xl h-12 font-black text-sm uppercase tracking-wider">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      {/* Payments List */}
      <div className="flex-1 min-h-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pagos Registrados</p>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {payments.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center">
              <p className="text-muted-foreground/60 italic text-sm">No hay pagos registrados aún...</p>
            </div>
          ) : (
            payments.map(p => {
              const mc = methodConfig[p.method];
              const Icon = mc.icon;
              return (
                <div key={p.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 border border-border">
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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Remaining / Change */}
      <div className="border-t border-border pt-3">
        {change > 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider italic text-muted-foreground">Vuelto a entregar</p>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${change.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{formatBs(change)} Bs</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider italic text-muted-foreground">Por Pagar / Restante</p>
            <div className="text-right">
              <p className="text-2xl font-black text-destructive">${remainingUsd.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{formatBs(remainingUsd)} Bs</p>
            </div>
          </div>
        )}
      </div>

      {/* Finalize */}
      <Button
        onClick={handleFinalize}
        disabled={payments.length === 0 || isLoading}
        className="w-full rounded-2xl h-12 font-black text-sm uppercase tracking-wider"
        variant={payments.length > 0 ? "default" : "secondary"}
      >
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isFullyPaid && <CheckCircle className="w-4 h-4 mr-2" />}
        {isLoading ? "Procesando..." : isFullyPaid ? "Saldar Deuda Completa" : "Registrar Abono"}
      </Button>
    </div>
  );
}

// Payment History Dialog
function PaymentHistoryDialog({
  group,
  onClose,
}: {
  group: GroupedAccount;
  onClose: () => void;
}) {
  const { exchangeRate } = useCurrency();
  const dualPrice = (usd: number) => `$${usd.toFixed(2)} / Bs. ${(usd * exchangeRate).toFixed(2)}`;
  const progress = group.totalAmount > 0 ? (group.amountPaid / group.totalAmount) * 100 : 0;

  // Parse payment history from notes
  const paymentHistory = group.items
    .filter(item => item.notes)
    .flatMap(item => {
      const notes = (item as any).notes as string;
      // Split notes by " | " pattern that separates payment entries with dates
      return notes.split(" | ").filter(n => n.includes("$") || n.includes("Bs"));
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black italic text-foreground">{group.customerName}</h2>
              <p className="text-xs text-muted-foreground">
                {format(new Date(group.movementDate), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Progress */}
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagado: <span className="font-semibold text-primary">{dualPrice(group.amountPaid)}</span></span>
              <span className="text-muted-foreground">Total: <span className="font-semibold">{dualPrice(group.totalAmount)}</span></span>
            </div>
            {group.amountDue > 0.005 && (
              <p className="text-sm font-semibold text-amber-500">Pendiente: {dualPrice(group.amountDue)}</p>
            )}
            {group.isPaid && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" /> Deuda Saldada
              </span>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Products */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Productos</p>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50 border border-border">
                  <div>
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Cant: {Number(item.quantity).toFixed(0)}</p>
                  </div>
                  <p className="font-semibold text-sm">{dualPrice(Number(item.total_amount))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Historial de Pagos</p>
            {paymentHistory.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center">
                <p className="text-muted-foreground/60 italic text-sm">No hay pagos registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paymentHistory.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium flex-1">{entry}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full rounded-2xl h-10">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
