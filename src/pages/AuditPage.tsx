import { FileText, User, ShoppingCart, Package, CreditCard, Store, ChevronDown, ChevronUp } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

const ACTION_ICONS: Record<string, typeof FileText> = {
  SALE_CREATED: ShoppingCart,
  ENTRY_CREATED: Package,
  PAYMENT_REGISTERED: CreditCard,
  USER_ROLE_UPDATED: User,
  BUSINESS_OPENED: Store,
  BUSINESS_CLOSED: Store,
};

const ACTION_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  SALE_CREATED: { label: "Venta", variant: "default" },
  ENTRY_CREATED: { label: "Entrada", variant: "secondary" },
  PAYMENT_REGISTERED: { label: "Pago", variant: "outline" },
  USER_ROLE_UPDATED: { label: "Usuario", variant: "outline" },
  BUSINESS_OPENED: { label: "Apertura", variant: "secondary" },
  BUSINESS_CLOSED: { label: "Cierre", variant: "destructive" },
};

/** Genera una descripción legible para cada tipo de evento */
function buildDescription(action: string, details: Record<string, unknown> | null): string {
  if (!details) return "—";

  switch (action) {
    case "SALE_CREATED": {
      const product = details.product_name || details.product || "producto";
      const qty = details.quantity ?? "";
      const total = details.total_amount != null ? `$${Number(details.total_amount).toFixed(2)}` : "";
      const customer = details.customer_name ? ` — Cliente: ${details.customer_name}` : "";
      const credit = details.is_credit ? " (Fiado)" : "";
      return `Vendió ${qty} ${product}${total ? ` por ${total}` : ""}${credit}${customer}`;
    }
    case "ENTRY_CREATED": {
      const product = details.product_name || details.product || "producto";
      const qty = details.quantity ?? "";
      const total = details.total_amount != null ? `$${Number(details.total_amount).toFixed(2)}` : "";
      return `Registró entrada de ${qty} ${product}${total ? ` por ${total}` : ""}`;
    }
    case "PAYMENT_REGISTERED": {
      const customer = details.customer_name || "cliente";
      const amount = details.amount != null ? `$${Number(details.amount).toFixed(2)}` : "";
      return `Registró pago${amount ? ` de ${amount}` : ""} de ${customer}`;
    }
    case "USER_ROLE_UPDATED": {
      const target = details.target_user || details.user || "usuario";
      const role = details.new_role || details.role || "";
      return `Cambió rol de ${target}${role ? ` a "${role}"` : ""}`;
    }
    case "BUSINESS_OPENED":
      return "Abrió el negocio para el día";
    case "BUSINESS_CLOSED":
      return "Cerró el negocio";
    default: {
      // Fallback: construir texto desde los campos disponibles
      const parts = Object.entries(details)
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`);
      return parts.join(" · ") || "—";
    }
  }
}

function DetailsRow({ details }: { details: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!details) return <span className="text-muted-foreground">—</span>;
  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? "Ocultar" : "Ver datos"}
      </button>
      {open && (
        <div className="mt-1 bg-muted/50 rounded p-2 space-y-0.5">
          {entries.map(([k, v]) => (
            <p key={k} className="text-xs">
              <span className="text-muted-foreground font-medium">{k}:</span>{" "}
              <span className="text-foreground">{String(v)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const { data: logs, isLoading } = useAuditLogs();

  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
  } = usePagination(logs, { initialItemsPerPage: 20 });

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
          {logs && logs.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {logs.length} registros en total
            </div>
          )}
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando registros...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay registros de auditoría</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead className="hidden lg:table-cell">Datos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData?.map((log) => {
                      const Icon = ACTION_ICONS[log.action] || FileText;
                      const badge = ACTION_BADGE[log.action];
                      const description = buildDescription(log.action, log.details);

                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                            <div>{format(new Date(log.created_at), "dd MMM yyyy", { locale: es })}</div>
                            <div className="text-muted-foreground">{format(new Date(log.created_at), "HH:mm:ss")}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {badge ? (
                                <Badge variant={badge.variant} className="text-[10px] w-fit">
                                  <Icon className="w-3 h-3 mr-1" />
                                  {badge.label}
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Icon className="w-4 h-4 text-primary shrink-0" />
                                  <span className="text-xs text-muted-foreground">{log.action}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[220px]">
                            <p className="text-foreground">{description}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="text-sm font-medium truncate max-w-[100px]">
                                {log.user_name || "Sistema"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <DetailsRow details={log.details} />
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
    </MainLayout>
  );
}
