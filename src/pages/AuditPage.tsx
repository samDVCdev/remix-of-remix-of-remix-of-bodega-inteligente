import { FileText, User, ShoppingCart, Package, CreditCard, Store } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ACTION_ICONS: Record<string, typeof FileText> = {
  SALE_CREATED: ShoppingCart,
  ENTRY_CREATED: Package,
  PAYMENT_REGISTERED: CreditCard,
  USER_ROLE_UPDATED: User,
  BUSINESS_OPENED: Store,
  BUSINESS_CLOSED: Store,
};

const ACTION_LABELS: Record<string, string> = {
  SALE_CREATED: "Venta registrada",
  ENTRY_CREATED: "Entrada registrada",
  PAYMENT_REGISTERED: "Pago registrado",
  USER_ROLE_UPDATED: "Rol actualizado",
  BUSINESS_OPENED: "Negocio abierto",
  BUSINESS_CLOSED: "Negocio cerrado",
};

export default function AuditPage() {
  const { data: logs, isLoading } = useAuditLogs();

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              Auditoría
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Historial de acciones del sistema</p>
          </div>
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando registros...</div>
          ) : logs?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay registros de auditoría</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden md:table-cell">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => {
                    const Icon = ACTION_ICONS[log.action] || FileText;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs sm:text-sm">
                          {format(new Date(log.created_at), "dd MMM HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm truncate max-w-[120px] sm:max-w-none">
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[100px]">
                          {log.user_name || "Sistema"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {log.details ? (
                            <pre className="bg-muted/50 p-2 rounded text-xs max-w-[300px] overflow-hidden">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
