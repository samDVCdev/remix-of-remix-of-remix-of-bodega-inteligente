import { Link } from "react-router-dom";
import { ArrowRight, Package, Scale, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface ProductsTableProps {
  products: Product[];
  isLoading?: boolean;
}

function getMainEquivalence(product: Product) {
  if (!product.equivalences?.length) return null;
  const purchasePackage = product.equivalences.find(e => e.display_order === 999);
  if (purchasePackage) return purchasePackage;
  return product.equivalences.reduce((max, e) =>
    e.base_unit_multiplier > (max?.base_unit_multiplier || 0) ? e : max,
    product.equivalences[0]
  );
}

function getEquivalenceDisplay(product: Product) {
  const mainPackage = getMainEquivalence(product);
  if (!mainPackage || mainPackage.base_unit_multiplier <= 1) return null;
  return `1 ${mainPackage.unit_name.toUpperCase()} = ${mainPackage.base_unit_multiplier} ${product.base_unit.toUpperCase()}`;
}

function getReadableStock(product: Product) {
  const mainPackage = getMainEquivalence(product);

  if (product.base_unit === 'gramo') {
    return `${(product.stock_base_units / 1000).toFixed(1)} KG`;
  }

  if (mainPackage && mainPackage.base_unit_multiplier > 1) {
    const packages = Math.floor(product.stock_base_units / mainPackage.base_unit_multiplier);
    const remainder = Math.round(product.stock_base_units % mainPackage.base_unit_multiplier);
    return (
      <div>
        <span className="font-semibold text-primary">{product.stock_base_units} {product.base_unit}s</span>
        <p className="text-xs text-muted-foreground">
          ≈ {packages.toFixed(1)} {mainPackage.unit_name.toUpperCase()}S
        </p>
      </div>
    );
  }

  return `${Math.round(product.stock_base_units)} ${product.base_unit}s`;
}

function getSaleTypeDisplay(product: Product) {
  switch (product.sale_type) {
    case 'weight':
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
          <Scale className="w-3 h-3" />
          Peso
        </span>
      );
    case 'variants':
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          <Layers className="w-3 h-3" />
          Multi
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          <Package className="w-3 h-3" />
          Unidad
        </span>
      );
  }
}

export function ProductsTable({ products, isLoading }: ProductsTableProps) {
  const { exchangeRate } = useCurrency();
  const displayProducts = products.slice(0, 10);

  const getPriceDisplay = (product: Product) => {
    switch (product.sale_type) {
      case 'weight':
        const pricePerKilo = product.price_per_kilo || 0;
        return (
          <div>
            <p>${pricePerKilo.toFixed(2)}/kg</p>
            <p className="text-xs text-muted-foreground">Bs. {(pricePerKilo * exchangeRate).toFixed(2)}</p>
          </div>
        );
      case 'variants':
        if (product.variants && product.variants.length > 0) {
          const minPrice = Math.min(...product.variants.map(v => v.price));
          return (
            <div>
              <p>Desde ${minPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Bs. {(minPrice * exchangeRate).toFixed(2)}</p>
            </div>
          );
        }
        return 'Multi-precio';
      default:
        return (
          <div>
            <p>${product.sale_price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Bs. {(product.sale_price * exchangeRate).toFixed(2)}</p>
          </div>
        );
    }
  };

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
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayProducts.map((product) => {
              const isLowStock = product.stock_base_units <= product.low_stock_threshold;
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="max-w-[150px] sm:max-w-[220px]">
                      <p className="font-medium truncate">{product.name}</p>
                      {getEquivalenceDisplay(product) ? (
                        <p className="text-xs text-primary font-medium">
                          {getEquivalenceDisplay(product)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{product.code}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {getSaleTypeDisplay(product)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-primary">
                    {getPriceDisplay(product)}
                  </TableCell>
                  <TableCell className="text-sm">{getReadableStock(product)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={cn(isLowStock ? "badge-low-stock" : "badge-in-stock")}>
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
