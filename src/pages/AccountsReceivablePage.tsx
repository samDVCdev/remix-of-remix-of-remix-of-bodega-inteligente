import { useState } from "react";
import { CreditCard, Check, Search, DollarSign } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { TablePagination } from "@/components/ui/table-pagination";
import { useAccountsReceivable, useMarkAsPaid, useRegisterPartialPayment } from "@/hooks/useAccountsReceivable";
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
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<AccountReceivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  
  const { data: accounts, isLoading } = useAccountsReceivable();
  const markAsPaid = useMarkAsPaid();
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

  const handleMarkPaid = async () => {
    if (payingId) {
      await markAsPaid.mutateAsync(payingId);
      setPayingId(null);
    }
  };

  const handlePartialPayment = async () => {
    if (paymentAccount && paymentAmount) {
      await registerPayment.mutateAsync({
        id: paymentAccount.id,
        amount: parseFloat(paymentAmount)
      });
      setPaymentAccount(null);
      setPaymentAmount("");
    }
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
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setPaymentAccount(account);
                                  setPaymentAmount("");
                                }}
                                className="gap-1 text-blue-600 border-blue-600 hover:bg-blue-50 px-2"
                              >
                                <DollarSign className="w-4 h-4" />
                                <span className="hidden sm:inline">Abonar</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPayingId(account.id)}
                                className="gap-1 text-green-600 border-green-600 hover:bg-green-50 px-2"
                              >
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">Pagar</span>
                              </Button>
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

      {/* Partial Payment Dialog */}
      <Dialog open={!!paymentAccount} onOpenChange={() => setPaymentAccount(null)}>
        <DialogContent className="bg-card mx-4">
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {paymentAccount && (
              <>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">{paymentAccount.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{paymentAccount.product_name}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>Debe:</span>
                    <span className="font-semibold text-amber-500">
                      {formatPrice(Number(paymentAccount.amount_due || paymentAccount.total_amount))}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Monto del Abono</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentAccount(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handlePartialPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Registrar Abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Payment Confirmation */}
      <AlertDialog open={!!payingId} onOpenChange={() => setPayingId(null)}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como pagado?</AlertDialogTitle>
            <AlertDialogDescription>Esta cuenta se marcará como pagada completamente y saldrá de la lista de pendientes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkPaid} className="bg-green-600 hover:bg-green-700">
              Confirmar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
