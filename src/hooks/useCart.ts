import { useState, useCallback } from "react";
import { CartItem, Product, ProductVariant } from "@/types/inventory";
import { toast } from "sonner";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addUnitProduct = useCallback((product: Product) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && !item.variant && !item.grams
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          total: (updated[existingIndex].quantity + 1) * updated[existingIndex].unit_price
        };
        return updated;
      }

      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        unit_price: product.sale_price,
        total: product.sale_price,
        display_name: product.name
      }];
    });
    toast.success(`${product.name} agregado`);
  }, []);

  const addWeightProduct = useCallback((product: Product, grams: number) => {
    const pricePerGram = (product.price_per_kilo || 0) / 1000;
    const total = pricePerGram * grams;

    setItems(prev => [...prev, {
      id: `${product.id}-${Date.now()}`,
      product,
      quantity: grams,
      unit_price: pricePerGram,
      total,
      grams,
      display_name: `${product.name} (${grams}gr)`
    }]);
    toast.success(`${product.name} (${grams}gr) agregado`);
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
        display_name: `${product.name} (${variant.name})`
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