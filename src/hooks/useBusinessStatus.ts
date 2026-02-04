import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BusinessStatus {
  id: string;
  is_open: boolean;
  opened_at: string | null;
  closed_at: string | null;
  opened_by: string | null;
  updated_at: string;
}

export function useBusinessStatus() {
  return useQuery({
    queryKey: ["business-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_status")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // If no row exists, return a default closed state
      if (!data) {
        return { id: '', is_open: false, opened_at: null, closed_at: null, opened_by: null, updated_at: '' } as BusinessStatus;
      }
      
      return data as unknown as BusinessStatus;
    },
  });
}

export function useToggleBusinessStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isOpen }: { isOpen: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData = isOpen
        ? {
          is_open: true,
          opened_at: new Date().toISOString(),
          opened_by: user?.id,
          closed_at: null
        }
        : {
          is_open: false,
          closed_at: new Date().toISOString()
        };

      const { data: firstRow } = await supabase
        .from("business_status")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!firstRow) throw new Error("No se encontró el registro de estado");

      const { data: result, error: updateError } = await supabase
        .from("business_status")
        .update(updateData)
        .eq("id", firstRow.id) 
        .select()
        .single();

      if (updateError) throw updateError;

      // Log audit event using direct insert
      await supabase
        .from("audit_logs")
        .insert({
          action: isOpen ? 'BUSINESS_OPENED' : 'BUSINESS_CLOSED',
          entity_type: 'business_status',
          entity_id: (result as any).id,
          user_id: user?.id,
          details: { is_open: isOpen }
        });

      return result as unknown as BusinessStatus;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-status"] });
      toast.success(data.is_open ? "Negocio abierto" : "Negocio cerrado");
    },
    onError: () => {
      toast.error("Error al cambiar el estado del negocio");
    },
  });
}
