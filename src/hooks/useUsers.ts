import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
  role: "admin" | "empleado";
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          created_at: profile.created_at,
          is_active: profile.is_active ?? true,
          role: (userRole?.role as "admin" | "empleado") || "empleado",
        };
      });

      return usersWithRoles;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "empleado" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      
      if (error) throw error;

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("audit_logs")
        .insert({
          action: 'USER_ROLE_UPDATED',
          entity_type: 'user_roles',
          user_id: user?.id,
          details: { target_user_id: userId, new_role: role }
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar el rol");
    },
  });
}

export function useUpdateUserName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Nombre actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar el nombre");
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("user_id", userId);
      
      if (error) throw error;

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("audit_logs")
        .insert({
          action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entity_type: 'profiles',
          user_id: user?.id,
          details: { target_user_id: userId }
        });
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(isActive ? "Usuario activado" : "Usuario desactivado");
    },
    onError: () => {
      toast.error("Error al cambiar el estado del usuario");
    },
  });
}
