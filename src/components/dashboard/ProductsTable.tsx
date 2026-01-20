import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product } from "@/types/inventory";
import { cn } from "@/lib/utils";

interface ProductsTableProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductsTable({ products, isLoading }: ProductsTableProps) {
  const displayProducts = products.slice(0, 10);

  if (isLoading) {
    return (
      <div className="stat-card">
        <div className="p-8 text-center text-muted-foreground">
          Cargando productos...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="stat-card">
        <div className="p-8 text-center">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">No hay productos registrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card p-0 overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-semibold">Productos Recientes</h3>
          <p className="text-xs text-muted-foreground">Últimos 10 productos en inventario</p>
        </div>
        <Link to="/productos">
          <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayProducts.map((product) => {
              const isLowStock = product.stock <= product.low_stock_threshold;
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">{product.code}</TableCell>
                  <TableCell className="font-medium max-w-[120px] truncate">{product.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">${Number(product.sale_price).toFixed(2)}</TableCell>
                  <TableCell>{Number(product.stock).toFixed(0)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={cn(
                      isLowStock ? "badge-low-stock" : "badge-in-stock"
                    )}>
                      {isLowStock ? "Bajo" : "OK"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {products.length > 10 && (
        <div className="p-3 border-t border-border text-center">
          <Link to="/productos">
            <Button variant="ghost" size="sm" className="text-primary">
              Ver {products.length - 10} productos más
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
