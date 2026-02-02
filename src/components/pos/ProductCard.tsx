import { Package, Scale, Layers } from "lucide-react";
import { Product } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const { formatPrice } = useCurrency();

  const getIcon = () => {
    switch (product.sale_type) {
      case 'weight':
        return <Scale className="w-10 h-10 text-primary" />;
      case 'variants':
        return <Layers className="w-10 h-10 text-accent" />;
      default:
        return <Package className="w-10 h-10 text-muted-foreground" />;
    }
  };

  const getPriceDisplay = () => {
    switch (product.sale_type) {
      case 'weight':
        return `${formatPrice(product.price_per_kilo || 0)}/kg`;
      case 'variants':
        return 'Multi-precio';
      default:
        return formatPrice(product.sale_price);
    }
  };

  const isLowStock = product.stock <= product.low_stock_threshold;

  return (
    <button
      onClick={() => onSelect(product)}
      className="product-card w-full relative"
      disabled={product.stock <= 0}
    >
      {/* Stock indicator */}
      {isLowStock && product.stock > 0 && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-warning animate-pulse" />
      )}
      {product.stock <= 0 && (
        <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
          <span className="text-destructive font-semibold text-sm">Sin stock</span>
        </div>
      )}

      {/* Icon */}
      <div className="mb-2">
        {getIcon()}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
        {product.name}
      </h3>

      {/* Price */}
      <p className={`text-sm font-bold ${product.sale_type === 'variants' ? 'text-accent' : 'text-primary'}`}>
        {getPriceDisplay()}
      </p>

      {/* Stock */}
      <p className="text-xs text-muted-foreground mt-1">
        Stock: {Number(product.stock).toFixed(0)}
      </p>
    </button>
  );
}