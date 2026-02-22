import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Product, CartItem } from "@/types/inventory";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  cartItems?: CartItem[];
  onRemoveItem?: (itemId: string) => void;
}

export function ProductGrid({ 
  products, 
  searchQuery, 
  onSearchChange, 
  onSelectProduct,
  cartItems = [],
  onRemoveItem
}: ProductGridProps) {
  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredProducts = products.filter(p =>
    normalize(p.name).includes(normalize(searchQuery)) ||
    normalize(p.code).includes(normalize(searchQuery))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No se encontraron productos
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                cartItems={cartItems}
                onIncrement={onSelectProduct}
                onDecrement={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}