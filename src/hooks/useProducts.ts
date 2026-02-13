import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant, UnitEquivalence } from "@/types/inventory";
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

      // Fetch equivalences
      const { data: equivalences, error: equivalencesError } = await supabase
        .from("unit_equivalences")
        .select("*")
        .order("display_order", { ascending: false });
      
      if (equivalencesError) throw equivalencesError;

      // Map variants and equivalences to products
      const productsWithData = (products as unknown as Product[]).map(product => ({
        ...product,
        variants: (variants as unknown as ProductVariant[]).filter(v => v.product_id === product.id),
        equivalences: (equivalences as unknown as UnitEquivalence[]).filter(e => e.product_id === product.id)
      }));

      return productsWithData;
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
  stock_base_units: number;
  stock?: number;
  base_unit: string;
  unit: string;
  low_stock_threshold?: number;
  sale_type?: 'unit' | 'weight' | 'variants';
  price_per_kilo?: number;
  image_url?: string | null;
}

interface VariantData {
  name: string;
  price: number;
  units_count?: number;
}

interface EquivalenceData {
  unit_name: string;
  base_unit_multiplier: number;
  price: number;
  display_order?: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData & { variants?: VariantData[]; equivalences?: EquivalenceData[] }) => {
      const { variants, equivalences, ...productData } = data;
      
      // Ensure stock is in sync with stock_base_units
      const finalData = {
        ...productData,
        stock: productData.stock_base_units,
      };
      
      const { data: result, error } = await supabase
        .from("products")
        .insert(finalData as any)
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

      // If product has equivalences, create them
      if (equivalences && equivalences.length > 0) {
        const equivalencesToInsert = equivalences.map((e, index) => ({
          product_id: result.id,
          unit_name: e.unit_name,
          base_unit_multiplier: e.base_unit_multiplier,
          price: e.price,
          display_order: e.display_order ?? index
        }));

        const { error: eqError } = await supabase
          .from("unit_equivalences")
          .insert(equivalencesToInsert);

        if (eqError) throw eqError;
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
    mutationFn: async ({ id, variants, equivalences, ...data }: CreateProductData & { id: string; variants?: VariantData[]; equivalences?: EquivalenceData[] }) => {
      // Ensure stock is in sync
      const finalData = {
        ...data,
        stock: data.stock_base_units,
      };
      
      const { data: result, error } = await supabase
        .from("products")
        .update(finalData as any)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // If variants are provided, delete old ones and create new ones
      if (data.sale_type === 'variants' && variants) {
        await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", id);

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

      // Update equivalences
      if (equivalences) {
        await supabase
          .from("unit_equivalences")
          .delete()
          .eq("product_id", id);

        if (equivalences.length > 0) {
          const equivalencesToInsert = equivalences.map((e, index) => ({
            product_id: id,
            unit_name: e.unit_name,
            base_unit_multiplier: e.base_unit_multiplier,
            price: e.price,
            display_order: e.display_order ?? index
          }));

          const { error: eqError } = await supabase
            .from("unit_equivalences")
            .insert(equivalencesToInsert);

          if (eqError) throw eqError;
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
