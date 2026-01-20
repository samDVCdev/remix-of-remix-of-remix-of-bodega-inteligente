import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InventoryMovement } from "@/types/inventory";
import { toast } from "sonner";

export function useMovements(type?: "entrada" | "salida") {
  return useQuery({
    queryKey: ["movements", type],
    queryFn: async () => {
      let query = supabase
        .from("inventory_movements")
        .select("*, product:products(*)")
        .order("movement_date", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (type) {
        query = query.eq("movement_type", type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as InventoryMovement[];
    },
  });
}

interface CreateMovementData {
  product_id: string;
  movement_type: "entrada" | "salida";
  quantity: number;
  unit_price: number;
  movement_date: string;
  notes?: string;
  is_credit?: boolean;
  customer_name?: string;
  sold_by?: string;
}

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMovementData) => {
      const total_amount = data.quantity * data.unit_price;
      
      const { data: result, error } = await supabase
        .from("inventory_movements")
        .insert({ 
          product_id: data.product_id,
          movement_type: data.movement_type,
          quantity: data.quantity,
          unit_price: data.unit_price,
          movement_date: data.movement_date,
          notes: data.notes,
          is_credit: data.is_credit || false,
          is_paid: !data.is_credit,
          customer_name: data.customer_name,
          sold_by: data.sold_by,
          total_amount,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      
      const message = variables.movement_type === "entrada" 
        ? "Entrada registrada exitosamente" 
        : "Salida registrada exitosamente";
      toast.success(message);
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error("Error al registrar el movimiento");
    },
  });
}

export function useDeleteMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_movements")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Movimiento eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar el movimiento");
    },
  });
}
