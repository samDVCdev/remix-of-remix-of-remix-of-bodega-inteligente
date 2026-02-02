import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant } from "@/types/inventory";
import { toast } from "sonner";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

export function useProductsWithVariants() {
  return useQuery({
    queryKey: ["products-with-variants"],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("name");
      
      if (productsError) throw productsError;

      // Fetch variants for products with sale_type = 'variants'
      const { data: variants, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .order("price");
      
      if (variantsError) throw variantsError;

      // Map variants to products
      const productsWithVariants = (products as unknown as Product[]).map(product => ({
        ...product,
        variants: (variants as unknown as ProductVariant[]).filter(v => v.product_id === product.id)
      }));

      return productsWithVariants;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as unknown as Product;
    },
    enabled: !!id,
  });
}

interface CreateProductData {
  code: string;
  name: string;
  description?: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  unit: string;
  low_stock_threshold?: number;
  category_id?: string | null;
  sale_type?: 'unit' | 'weight' | 'variants';
  price_per_kilo?: number;
}

interface VariantData {
  name: string;
  price: number;
  units_count?: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData & { variants?: VariantData[] }) => {
      const { variants, ...productData } = data;
      
      const { data: result, error } = await supabase
        .from("products")
        .insert(productData as any)
        .select()
        .single();
      
      if (error) throw error;

      // If product has variants, create them
      if (variants && variants.length > 0 && data.sale_type === 'variants') {
        const variantsToInsert = variants.map(v => ({
          product_id: result.id,
          name: v.name,
          price: v.price,
          units_count: v.units_count || 1
        }));

        const { error: variantsError } = await supabase
          .from("product_variants")
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-variants"] });
      toast.success("Producto creado exitosamente");
    },
    onError: (error: Error) => {
      if (error.message.includes("unique")) {
        toast.error("El código del producto ya existe");
      } else {
        toast.error("Error al crear el producto");
      }
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, variants, ...data }: CreateProductData & { id: string; variants?: VariantData[] }) => {
      const { data: result, error } = await supabase
        .from("products")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // If variants are provided, delete old ones and create new ones
      if (data.sale_type === 'variants' && variants) {
        // Delete existing variants
        await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", id);

        // Insert new variants
        if (variants.length > 0) {
          const variantsToInsert = variants.map(v => ({
            product_id: id,
            name: v.name,
            price: v.price,
            units_count: v.units_count || 1
          }));

          const { error: variantsError } = await supabase
            .from("product_variants")
            .insert(variantsToInsert);

          if (variantsError) throw variantsError;
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-variants"] });
      toast.success("Producto actualizado exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar el producto");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-variants"] });
      toast.success("Producto eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar el producto");
    },
  });
}