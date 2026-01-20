import { useState } from "react";
import { CreditCard, Check, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAccountsReceivable, useMarkAsPaid } from "@/hooks/useAccountsReceivable";
import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AccountsReceivablePage() {
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  
  const { data: accounts, isLoading } = useAccountsReceivable();
  const markAsPaid = useMarkAsPaid();
  const { formatPrice } = useCurrency();

  const filteredAccounts = accounts?.filter(
    (a) =>
      a.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = accounts?.reduce((sum, a) => sum + Number(a.total_amount), 0) || 0;

  const handleMarkPaid = async () => {
    if (payingId) {
      await markAsPaid.mutateAsync(payingId);
      setPayingId(null);
    }
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
          <div className="stat-card p-4 bg-amber-500/10 border-amber-500/20">
            <p className="text-sm text-muted-foreground">Total Pendiente</p>
            <p className="text-2xl font-display font-bold text-amber-500">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Producto</TableHead>
                    <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts?.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="text-xs">
                        {format(new Date(account.movement_date), "dd MMM", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.customer_name || "Sin nombre"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {account.product_name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {account.seller_name || "-"}
                      </TableCell>
                      <TableCell className="font-semibold text-amber-500">
                        {formatPrice(Number(account.total_amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPayingId(account.id)}
                          className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">Pagado</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!payingId} onOpenChange={() => setPayingId(null)}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como pagado?</AlertDialogTitle>
            <AlertDialogDescription>Esta cuenta se marcará como pagada y saldrá de la lista de pendientes.</AlertDialogDescription>
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
