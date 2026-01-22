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
        .from("business_status" as any)
        .select("*")
        .single();
      
      if (error) throw error;
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

      const { data, error } = await supabase
        .from("business_status" as any)
        .update(updateData)
        .select()
        .single();
      
      if (error) throw error;

      // Log audit event using direct insert
      await supabase
        .from("audit_logs" as any)
        .insert({
          action: isOpen ? 'BUSINESS_OPENED' : 'BUSINESS_CLOSED',
          entity_type: 'business_status',
          entity_id: (data as any).id,
          user_id: user?.id,
          details: { is_open: isOpen }
        });

      return data as unknown as BusinessStatus;
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
