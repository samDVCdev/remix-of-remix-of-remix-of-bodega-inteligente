import { Package, Scale, Layers, Plus } from "lucide-react";
import { Product } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const { formatDualPrice } = useCurrency();

  const getPriceInfo = () => {
    switch (product.sale_type) {
      case 'weight':
        return { amount: product.price_per_kilo || 0, suffix: '/kg' };
      case 'variants':
        return { amount: product.sale_price, suffix: '' };
      default:
        return { amount: product.sale_price, suffix: '' };
    }
  };

  const { amount, suffix } = getPriceInfo();
  const dual = formatDualPrice(amount);
  const isLowStock = product.stock <= product.low_stock_threshold;
  const outOfStock = product.stock <= 0;

  return (
    <button
      onClick={() => onSelect(product)}
      className="product-card w-full relative group"
      disabled={outOfStock}
    >
      {/* Low stock indicator */}
      {isLowStock && !outOfStock && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-warning animate-pulse z-10" />
      )}

      {/* Out of stock overlay */}
      {outOfStock && (
        <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center z-10">
          <span className="text-destructive font-semibold text-sm">Sin stock</span>
        </div>
      )}

      {/* Product Image or Icon */}
      <div className="w-full aspect-[3/2] lg:aspect-[2/1] rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden mb-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-1"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center">
            {product.sale_type === 'weight' ? (
              <Scale className="w-7 h-7 text-primary/40" />
            ) : product.sale_type === 'variants' ? (
              <Layers className="w-7 h-7 text-accent/40" />
            ) : (
              <Package className="w-7 h-7 text-muted-foreground/40" />
            )}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-xs line-clamp-2 mb-1 text-left w-full">
        {product.name}
      </h3>

      {/* Stock */}
      <p className="text-[10px] text-muted-foreground mb-1 text-left w-full">
        Stock: {product.base_unit === 'gramo' 
          ? `${(product.stock_base_units / 1000).toFixed(1)} KG`
          : Number(product.stock).toFixed(0)
        }
      </p>

      {/* Price + Add button */}
      <div className="flex items-end justify-between w-full mt-auto">
        <div className="text-left">
          <p className="text-base lg:text-xl font-bold text-primary leading-tight">
            {dual.usd}{suffix}
          </p>
          <p className="text-xs lg:text-sm text-muted-foreground font-medium">
            {dual.ves}{suffix}
          </p>
        </div>
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    </button>
  );
}
