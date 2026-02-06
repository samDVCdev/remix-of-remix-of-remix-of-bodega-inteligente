import { useState } from "react";
import { CreditCard, Search, DollarSign } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { TablePagination } from "@/components/ui/table-pagination";
import { PaymentModal } from "@/components/pos/PaymentModal";
import type { Payment } from "@/components/pos/PaymentModal";
import { useAccountsReceivable, useRegisterPartialPayment } from "@/hooks/useAccountsReceivable";
import { usePagination } from "@/hooks/usePagination";
import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AccountReceivable {
  id: string;
  product_id: string;
  movement_date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  amount_paid?: number;
  amount_due?: number;
  debt_percentage?: number;
  customer_name: string | null;
  product_name: string | null;
  product_code: string | null;
  seller_name: string | null;
}

export default function AccountsReceivablePage() {
  const [search, setSearch] = useState("");
  const [paymentAccount, setPaymentAccount] = useState<AccountReceivable | null>(null);
  
  const { data: accounts, isLoading } = useAccountsReceivable();
  const registerPayment = useRegisterPartialPayment();
  const { formatPrice } = useCurrency();

  const filteredAccounts = accounts?.filter(
    (a) =>
      a.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.product_name?.toLowerCase().includes(search.toLowerCase())
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

  const totalPending = accounts?.reduce((sum, a) => sum + Number(a.amount_due || a.total_amount), 0) || 0;

  const handlePaymentConfirm = async (payments: Payment[]) => {
    if (!paymentAccount) return;
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

    await registerPayment.mutateAsync({
      id: paymentAccount.id,
      amount: totalPaidUsd,
      notes,
    });
    setPaymentAccount(null);
  };

  const getPaymentProgress = (account: AccountReceivable) => {
    const paid = Number(account.amount_paid || 0);
    const total = Number(account.total_amount);
    return total > 0 ? (paid / total) * 100 : 0;
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
            <p className="text-xl sm:text-2xl font-display font-bold text-amber-500 truncate">
              {formatPrice(totalPending)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente o producto..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" 
          />
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
                      <TableHead className="hidden sm:table-cell">Producto</TableHead>
                      <TableHead className="hidden lg:table-cell">Progreso</TableHead>
                      <TableHead>Debe</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.map((account) => {
                      const amountDue = Number(account.amount_due || account.total_amount);
                      const amountPaid = Number(account.amount_paid || 0);
                      const progress = getPaymentProgress(account);
                      
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="text-xs">
                            {format(new Date(account.movement_date), "dd MMM", { locale: es })}
                          </TableCell>
                          <TableCell className="font-medium max-w-[100px] truncate">
                            {account.customer_name || "Sin nombre"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell max-w-[120px] truncate">
                            {account.product_name}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="space-y-1">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(amountPaid)} de {formatPrice(Number(account.total_amount))}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-amber-500 text-sm">
                            {formatPrice(amountDue)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setPaymentAccount(account)}
                              className="gap-1 text-blue-600 border-blue-600 hover:bg-blue-50 px-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span className="hidden sm:inline">Abonar</span>
                            </Button>
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

      {/* Payment Modal */}
      <PaymentModal
        open={!!paymentAccount}
        onClose={() => setPaymentAccount(null)}
        totalUsd={Number(paymentAccount?.amount_due || paymentAccount?.total_amount || 0)}
        onConfirm={handlePaymentConfirm}
      />
    </MainLayout>
  );
}
