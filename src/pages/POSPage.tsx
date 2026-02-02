import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CartFAB } from "@/components/pos/CartFAB";
import { WeightModal } from "@/components/pos/WeightModal";
import { VariantModal } from "@/components/pos/VariantModal";
import { CreditSaleModal } from "@/components/pos/CreditSaleModal";
import { useProductsWithVariants } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useCreateMovement } from "@/hooks/useMovements";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessStatus } from "@/hooks/useBusinessStatus";
import { Product, ProductVariant } from "@/types/inventory";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  const { data: products, isLoading } = useProductsWithVariants();
  const { isAdmin } = useAuth();
  const { data: businessStatus } = useBusinessStatus();
  const createMovement = useCreateMovement();
  const { user } = useAuth();

  const {
    items,
    addUnitProduct,
    addWeightProduct,
    addVariantProduct,
    removeItem,
    clearCart,
    getTotal,
    getItemCount
  } = useCart();

  const handleSelectProduct = (product: Product) => {
    if (!isAdmin && businessStatus && !businessStatus.is_open) {
      toast.error("El negocio está cerrado. No puedes registrar ventas.");
      return;
    }

    switch (product.sale_type) {
      case 'weight':
        setWeightProduct(product);
        break;
      case 'variants':
        setVariantProduct(product);
        break;
      default:
        addUnitProduct(product);
        break;
    }
  };

  const handleWeightConfirm = (product: Product, grams: number) => {
    addWeightProduct(product, grams);
  };

  const handleVariantConfirm = (product: Product, variant: ProductVariant, quantity: number) => {
    addVariantProduct(product, variant, quantity);
  };

  const processSale = async (isCredit: boolean, customerName?: string) => {
    if (items.length === 0) return;

    if (!isAdmin && businessStatus && !businessStatus.is_open) {
      toast.error("El negocio está cerrado. No puedes registrar ventas.");
      return;
    }

    try {
      for (const item of items) {
        await createMovement.mutateAsync({
          product_id: item.product.id,
          quantity: item.grams ? item.grams / 1000 : item.quantity, // Convert grams to kg for weight products
          unit_price: item.grams ? item.product.price_per_kilo || 0 : item.unit_price,
          movement_date: new Date().toISOString().split("T")[0],
          movement_type: "salida",
          notes: item.variant ? `Variante: ${item.variant.name}` : undefined,
          is_credit: isCredit,
          customer_name: isCredit ? customerName : undefined,
          sold_by: user?.id,
        });
      }

      toast.success(
        isCredit 
          ? `Fiao registrado para ${customerName}` 
          : `Venta registrada: ${items.length} producto(s)`
      );
      clearCart();
      setIsCartOpen(false);
    } catch (error) {
      toast.error("Error al procesar la venta");
    }
  };

  const handleCheckout = () => {
    processSale(false);
  };

  const handleCreditSale = () => {
    setIsCreditModalOpen(true);
  };

  const handleCreditConfirm = (customerName: string) => {
    processSale(true, customerName);
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              Punto de Venta
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Toca un producto para agregarlo al carrito
            </p>
          </div>
        </div>

        {/* Business Status Warning for Employees */}
        {!isAdmin && businessStatus && !businessStatus.is_open && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive mb-4">
            <p className="font-medium">⚠️ El negocio está cerrado</p>
            <p className="text-sm opacity-80">No puedes registrar ventas en este momento.</p>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Cargando productos...
            </div>
          ) : (
            <ProductGrid
              products={products || []}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectProduct={handleSelectProduct}
            />
          )}
        </div>
      </div>

      {/* Cart FAB */}
      <CartFAB 
        itemCount={getItemCount()} 
        onClick={() => setIsCartOpen(true)} 
      />

      {/* Cart Panel */}
      <CartPanel
        items={items}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
        onCreditSale={handleCreditSale}
        total={getTotal()}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Weight Modal */}
      <WeightModal
        open={!!weightProduct}
        onOpenChange={(open) => !open && setWeightProduct(null)}
        product={weightProduct}
        onConfirm={handleWeightConfirm}
      />

      {/* Variant Modal */}
      <VariantModal
        open={!!variantProduct}
        onOpenChange={(open) => !open && setVariantProduct(null)}
        product={variantProduct}
        onConfirm={handleVariantConfirm}
      />

      {/* Credit Sale Modal */}
      <CreditSaleModal
        open={isCreditModalOpen}
        onOpenChange={setIsCreditModalOpen}
        items={items}
        total={getTotal()}
        onConfirm={handleCreditConfirm}
      />
    </MainLayout>
  );
}