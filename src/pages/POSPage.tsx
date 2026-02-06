import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CartFAB } from "@/components/pos/CartFAB";
import { WeightModal } from "@/components/pos/WeightModal";
import { VariantModal } from "@/components/pos/VariantModal";
import { EquivalenceModal } from "@/components/pos/EquivalenceModal";
import { CreditSaleModal } from "@/components/pos/CreditSaleModal";
import { PaymentModal, Payment } from "@/components/pos/PaymentModal";
import { useProductsWithVariants } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useCreateMovement } from "@/hooks/useMovements";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessStatus } from "@/hooks/useBusinessStatus";
import { Product, ProductVariant, UnitEquivalence } from "@/types/inventory";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [unitProduct, setUnitProduct] = useState<Product | null>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
        // Weight products always show modal to input grams
        setWeightProduct(product);
        break;
      case 'variants':
        setVariantProduct(product);
        break;
      default:
        // For unit products:
        // Filter out purchase package equivalences (display_order === 999)
        // These are only for inventory management, not for sale
        const saleEquivalences = (product.equivalences || []).filter(
          eq => eq.display_order !== 999
        );
        
        if (saleEquivalences.length === 0) {
          // No sale equivalences, add base unit directly using sale_price
          addUnitProduct(product, null, 1);
        } else if (saleEquivalences.length === 1) {
          // Only 1 sale presentation defined - add directly without modal
          addUnitProduct(product, saleEquivalences[0], 1);
        } else {
          // Multiple sale equivalences (2+), show modal to choose
          setUnitProduct(product);
        }
        break;
    }
  };

  const handleWeightConfirm = (product: Product, grams: number) => {
    addWeightProduct(product, grams);
  };

  const handleVariantConfirm = (product: Product, variant: ProductVariant, quantity: number) => {
    addVariantProduct(product, variant, quantity);
  };

  const handleEquivalenceConfirm = (product: Product, equivalence: UnitEquivalence | null, quantity: number) => {
    addUnitProduct(product, equivalence, quantity);
  };

  const processSale = async (isCredit: boolean, customerName?: string, paymentNotes?: string) => {
    if (items.length === 0) return;

    if (!isAdmin && businessStatus && !businessStatus.is_open) {
      toast.error("El negocio está cerrado. No puedes registrar ventas.");
      return;
    }

    // Generate a credit_group_id for credit sales with multiple items
    const creditGroupId = isCredit && items.length > 1 
      ? crypto.randomUUID() 
      : undefined;

    try {
      for (const item of items) {
        // Calculate the quantity in base units
        let quantityInBaseUnits: number;
        let unitEquivalenceId: string | undefined;
        
        if (item.grams) {
          // Weight product: grams are already base units
          quantityInBaseUnits = item.grams;
        } else if (item.equivalence) {
          // Has equivalence: multiply quantity by multiplier
          quantityInBaseUnits = item.quantity * item.equivalence.base_unit_multiplier;
          unitEquivalenceId = item.equivalence.id;
        } else if (item.variant) {
          // Variant product: multiply by units_count
          quantityInBaseUnits = item.quantity * (item.variant.units_count || 1);
        } else {
          // Simple unit product
          quantityInBaseUnits = item.quantity;
        }

        await createMovement.mutateAsync({
          product_id: item.product.id,
          quantity: quantityInBaseUnits,
          unit_price: item.unit_price,
          total_amount: item.total,
          movement_date: new Date().toISOString().split("T")[0],
          movement_type: "salida",
          notes: [
            item.equivalence 
              ? `Equivalencia: ${item.equivalence.unit_name} x${item.quantity}` 
              : item.variant 
                ? `Variante: ${item.variant.name} x${item.quantity}` 
                : undefined,
            paymentNotes
          ].filter(Boolean).join(' — ') || undefined,
          is_credit: isCredit,
          customer_name: isCredit ? customerName : undefined,
          sold_by: user?.id,
          unit_equivalence_id: unitEquivalenceId,
          credit_group_id: creditGroupId,
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
    setIsCartOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = (payments: Payment[]) => {
    // Build notes from payment details
    const paymentNotes = payments.map(p => {
      const method = p.method === 'cash_usd' ? 'Efectivo $' : 
                     p.method === 'cash_bs' ? 'Efectivo Bs' :
                     p.method === 'card_bs' ? 'Tarjeta Bs' : 'Transferencia Bs';
      const ref = p.reference ? ` (Ref: ${p.reference})` : '';
      return `${method}: $${p.amountUsd.toFixed(2)}${ref}`;
    }).join(' | ');

    processSale(false, undefined, paymentNotes);
    setIsPaymentModalOpen(false);
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

      {/* Equivalence Modal for unit products */}
      <EquivalenceModal
        open={!!unitProduct}
        onOpenChange={(open) => !open && setUnitProduct(null)}
        product={unitProduct}
        onConfirm={handleEquivalenceConfirm}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalUsd={getTotal()}
        onConfirm={handlePaymentConfirm}
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
