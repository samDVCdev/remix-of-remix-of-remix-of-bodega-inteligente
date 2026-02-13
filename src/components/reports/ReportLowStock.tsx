import { AlertTriangle } from "lucide-react";
import { Product } from "@/types/inventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrency } from "@/hooks/useCurrency";

interface ReportLowStockProps {
  products: Product[];
  isLoading: boolean;
}

export function ReportLowStock({ products, isLoading }: ReportLowStockProps) {
  const { formatPrice } = useCurrency();

  const lowStockProducts = products.filter(
    (p) => Number(p.stock_base_units) <= Number(p.low_stock_threshold)
  );

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="stat-card p-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-warning/10">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-display font-semibold">Productos con Stock Bajo ({lowStockProducts.length})</h3>
          <p className="text-xs text-muted-foreground">Productos cuyo stock está por debajo del umbral mínimo</p>
        </div>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-success/50 mb-4" />
          <p className="text-muted-foreground">Todos los productos tienen stock suficiente ✓</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Precio Venta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-warning font-semibold">
                    {Number(p.stock_base_units).toFixed(0)} {p.base_unit}s
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {Number(p.low_stock_threshold).toFixed(0)}
                  </TableCell>
                  <TableCell>{formatPrice(Number(p.sale_price))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
