import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
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
          username: profile.username,
          email: profile.email,
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

      // Obtener nombre del usuario afectado
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("user_id", userId)
        .single();
      const targetName = targetProfile?.full_name || targetProfile?.username || "Usuario desconocido";

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("audit_logs")
        .insert({
          action: 'USER_ROLE_UPDATED',
          entity_type: 'user_roles',
          user_id: user?.id,
          details: { target_user_name: targetName, new_role: role }
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
    mutationFn: async ({ userId, fullName, username }: { userId: string; fullName: string; username?: string }) => {
      const updateData: Record<string, string> = { full_name: fullName };
      if (username !== undefined) updateData.username = username;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el usuario");
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

      // Obtener nombre del usuario afectado
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("user_id", userId)
        .single();
      const targetName = targetProfile?.full_name || targetProfile?.username || "Usuario desconocido";

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("audit_logs")
        .insert({
          action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entity_type: 'profiles',
          user_id: user?.id,
          details: { target_user_name: targetName, estado: isActive ? 'activado' : 'desactivado' }
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
