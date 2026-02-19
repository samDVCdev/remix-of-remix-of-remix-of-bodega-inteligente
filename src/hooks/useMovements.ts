import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InventoryMovement } from "@/types/inventory";
import { toast } from "sonner";
import { addToOfflineQueue } from "@/lib/offlineQueue";

export function useMovements(type?: "entrada" | "salida") {
  return useQuery({
    queryKey: ["movements", type],
    queryFn: async () => {
      let query = supabase
        .from("inventory_movements")
        .select("*, product:products(*, equivalences:unit_equivalences(*))")
        .order("movement_date", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (type) {
        query = query.eq("movement_type", type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as InventoryMovement[];
    },
  });
}

interface CreateMovementData {
  product_id: string;
  movement_type: "entrada" | "salida";
  quantity: number;
  unit_price: number;
  total_amount?: number;
  movement_date: string;
  notes?: string;
  is_credit?: boolean;
  customer_name?: string;
  sold_by?: string;
  unit_equivalence_id?: string;
  credit_group_id?: string;
}

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMovementData) => {
      const total_amount = data.total_amount ?? (data.quantity * data.unit_price);
      
      const insertData = {
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
        unit_equivalence_id: data.unit_equivalence_id,
        credit_group_id: data.credit_group_id,
        total_amount,
      };

      // If offline, queue the mutation
      if (!navigator.onLine) {
        addToOfflineQueue({
          table: "inventory_movements",
          operation: "insert",
          data: insertData,
        });
        return insertData;
      }

      const { data: result, error } = await supabase
        .from("inventory_movements")
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      
      if (!navigator.onLine) {
        toast.info("Guardado offline — se sincronizará al reconectar");
      } else {
        const message = variables.movement_type === "entrada" 
          ? "Entrada registrada exitosamente" 
          : "Salida registrada exitosamente";
        toast.success(message);
      }
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
      if (!navigator.onLine) {
        addToOfflineQueue({
          table: "inventory_movements",
          operation: "delete",
          data: { id },
        });
        return;
      }

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
      
      if (!navigator.onLine) {
        toast.info("Eliminación guardada offline — se sincronizará al reconectar");
      } else {
        toast.success("Movimiento eliminado exitosamente");
      }
    },
    onError: () => {
      toast.error("Error al eliminar el movimiento");
    },
  });
}
