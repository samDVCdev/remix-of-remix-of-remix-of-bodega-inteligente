import { useState, useCallback } from "react";
import { CartItem, Product, ProductVariant, UnitEquivalence } from "@/types/inventory";
import { toast } from "sonner";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addUnitProduct = useCallback((product: Product, equivalence: UnitEquivalence | null, quantity: number = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && 
                !item.variant && 
                !item.grams && 
                item.equivalence?.id === equivalence?.id
      );

      const price = equivalence?.price ?? product.sale_price;
      const baseUnitsPerItem = equivalence?.base_unit_multiplier ?? 1;

      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQuantity = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
          total: newQuantity * price
        };
        return updated;
      }

      const displayName = equivalence 
        ? `${product.name} (${equivalence.unit_name})`
        : product.name;

      return [...prev, {
        id: `${product.id}-${equivalence?.id || 'base'}-${Date.now()}`,
        product,
        quantity,
        unit_price: price,
        total: price * quantity,
        display_name: displayName,
        equivalence,
        base_units_per_item: baseUnitsPerItem
      }];
    });
    
    const label = equivalence ? `${product.name} (${equivalence.unit_name})` : product.name;
    toast.success(`${label} agregado`);
  }, []);

  const addWeightProduct = useCallback((product: Product, kg: number) => {
    const pricePerKilo = product.price_per_kilo || 0;
    const total = pricePerKilo * kg;
    const gramsForStock = kg * 1000; // Convert KG to grams for stock deduction

    setItems(prev => [...prev, {
      id: `${product.id}-${Date.now()}`,
      product,
      quantity: kg,
      unit_price: pricePerKilo,
      total,
      grams: gramsForStock, // Internal: grams for stock deduction
      display_name: `${product.name} (${kg} KG)`,
      base_units_per_item: 1000 // 1 KG = 1000 grams (base units)
    }]);
    toast.success(`${product.name} (${kg} KG) agregado`);
  }, []);

  const addVariantProduct = useCallback((product: Product, variant: ProductVariant, quantity: number) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.variant?.id === variant.id
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQuantity = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
          total: newQuantity * updated[existingIndex].unit_price
        };
        return updated;
      }

      return [...prev, {
        id: `${product.id}-${variant.id}-${Date.now()}`,
        product,
        quantity,
        unit_price: variant.price,
        total: variant.price * quantity,
        variant,
        display_name: `${product.name} (${variant.name})`,
        base_units_per_item: variant.units_count || 1
      }];
    });
    toast.success(`${product.name} (${variant.name}) agregado`);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total: quantity * item.unit_price
        };
      }
      return item;
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.length;
  }, [items]);

  return {
    items,
    addUnitProduct,
    addWeightProduct,
    addVariantProduct,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount
  };
}
