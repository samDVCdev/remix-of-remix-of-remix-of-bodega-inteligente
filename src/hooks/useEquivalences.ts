import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnitEquivalence } from "@/types/inventory";
import { toast } from "sonner";

export function useEquivalences(productId?: string) {
  return useQuery({
    queryKey: ["equivalences", productId],
    queryFn: async () => {
      let query = supabase
        .from("unit_equivalences")
        .select("*")
        .order("display_order", { ascending: false });
      
      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as UnitEquivalence[];
    },
    enabled: productId !== undefined,
  });
}

interface CreateEquivalenceData {
  product_id: string;
  unit_name: string;
  base_unit_multiplier: number;
  display_order: number;
  price: number;
}

export function useCreateEquivalence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEquivalenceData) => {
      const { data: result, error } = await supabase
        .from("unit_equivalences")
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equivalences", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Equivalencia creada");
    },
    onError: () => {
      toast.error("Error al crear la equivalencia");
    },
  });
}

export function useDeleteEquivalence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("unit_equivalences")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equivalences"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Equivalencia eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar la equivalencia");
    },
  });
}

// Function to get human-readable stock
export async function getReadableStock(productId: string): Promise<string> {
  const { data, error } = await supabase
    .rpc('get_readable_stock', { _product_id: productId });
  
  if (error) {
    console.error("Error getting readable stock:", error);
    return "Error al obtener stock";
  }
  
  return data as string;
}
