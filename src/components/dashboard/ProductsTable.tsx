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

function getDisplayStock(product: Product): string {
  const stock = Number(product.stock_base_units || product.stock);
  
  // Weight-based products: show in KG
  if (product.base_unit === "gramo") {
    const kg = stock / 1000;
    return kg % 1 === 0 ? `${kg} kg` : `${kg.toFixed(2)} kg`;
  }
  if (product.base_unit === "centimetro") {
    const m = stock / 100;
    return m % 1 === 0 ? `${m} m` : `${m.toFixed(2)} m`;
  }
  if (product.base_unit === "mililitro") {
    const l = stock / 1000;
    return l % 1 === 0 ? `${l} lt` : `${l.toFixed(2)} lt`;
  }

  // Unit-based: find the largest sale equivalence (not purchase package with display_order 999)
  const saleEquivs = product.equivalences?.filter(e => e.display_order !== 999 && e.base_unit_multiplier > 1) || [];
  if (saleEquivs.length > 0) {
    const largest = saleEquivs.reduce((max, e) => e.base_unit_multiplier > max.base_unit_multiplier ? e : max, saleEquivs[0]);
    const count = Math.floor(stock / largest.base_unit_multiplier);
    const remainder = stock % largest.base_unit_multiplier;
    if (count > 0) {
      let result = `${count} ${largest.unit_name}`;
      if (remainder > 0) result += ` + ${remainder}`;
      return result;
    }
  }

  return `${stock}`;
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
              const isLowStock = product.stock_base_units <= product.low_stock_threshold;
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">{product.code}</TableCell>
                  <TableCell className="font-medium max-w-[120px] truncate">{product.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">${Number(product.sale_price).toFixed(2)}</TableCell>
                  <TableCell>{getDisplayStock(product)}</TableCell>
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
