import { useState } from "react";
import { Users, Shield, User, Pencil, Power, PowerOff, Search, UserPlus, AtSign } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUsers, useUpdateUserRole, useUpdateUserName, useToggleUserStatus } from "@/hooks/useUsers";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const updateName = useUpdateUserName();
  const toggleStatus = useToggleUserStatus();
  
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "empleado">("empleado");
  const [usernameError, setUsernameError] = useState("");
  const [togglingUser, setTogglingUser] = useState<UserWithRole | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredUsers = users?.filter(
    (u) => 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (userId: string, role: "admin" | "empleado") => {
    updateRole.mutate({ userId, role });
  };

  const validateUsername = (value: string) => {
    if (!value) { setUsernameError("El usuario es requerido"); return false; }
    if (value.length < 3) { setUsernameError("Mínimo 3 caracteres"); return false; }
    if (value.length > 30) { setUsernameError("Máximo 30 caracteres"); return false; }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) { setUsernameError("Solo letras, números, - y _"); return false; }
    setUsernameError("");
    return true;
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setEditName(user.full_name || "");
    setEditUsername(user.username || "");
    setEditRole(user.role);
    setUsernameError("");
  };

  const handleSaveEdit = () => {
    if (!editingUser || !editName.trim()) return;
    if (!validateUsername(editUsername)) return;

    // Update name & username
    updateName.mutate({ userId: editingUser.user_id, fullName: editName.trim(), username: editUsername.toLowerCase().trim() });

    // Update role if changed
    if (editRole !== editingUser.role) {
      updateRole.mutate({ userId: editingUser.user_id, role: editRole });
    }

    setEditingUser(null);
  };

  const handleToggleStatus = () => {
    if (togglingUser) {
      toggleStatus.mutate({ userId: togglingUser.user_id, isActive: !togglingUser.is_active });
      setTogglingUser(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              Usuarios
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Administra los usuarios del sistema</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar usuarios..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card p-4">
            <p className="text-sm text-muted-foreground">Total Usuarios</p>
            <p className="text-2xl font-bold">{users?.length || 0}</p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-muted-foreground">Administradores</p>
            <p className="text-2xl font-bold text-primary">{users?.filter(u => u.role === 'admin').length || 0}</p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-muted-foreground">Empleados</p>
            <p className="text-2xl font-bold">{users?.filter(u => u.role === 'empleado').length || 0}</p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-muted-foreground">Activos</p>
            <p className="text-2xl font-bold text-success">{users?.filter(u => u.is_active).length || 0}</p>
          </div>
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando usuarios...</div>
          ) : filteredUsers?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha de Registro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id} className={cn(!user.is_active && "opacity-50")}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            user.role === "admin" ? "bg-primary/10" : "bg-muted"
                          )}>
                            {user.role === "admin" ? (
                              <Shield className="w-4 h-4 text-primary" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium truncate max-w-[150px] block">
                              {user.full_name || "Sin nombre"}
                            </span>
                            {(user as any).username && (
                              <span className="text-xs text-muted-foreground">@{(user as any).username}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {format(new Date(user.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          user.is_active 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: "admin" | "empleado") => 
                            handleRoleChange(user.user_id, value)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Admin
                              </span>
                            </SelectItem>
                            <SelectItem value="empleado">
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Empleado
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            title="Editar usuario"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTogglingUser(user)}
                            className={cn(
                              user.is_active 
                                ? "text-destructive hover:text-destructive" 
                                : "text-success hover:text-success"
                            )}
                            title={user.is_active ? "Desactivar" : "Activar"}
                          >
                            {user.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[450px] lg:max-w-[500px] bg-card mx-4">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre Completo *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre de Usuario *</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={editUsername}
                  onChange={(e) => { setEditUsername(e.target.value); validateUsername(e.target.value); }}
                  placeholder="juanperez"
                  className="pl-10"
                />
              </div>
              {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
              <p className="text-xs text-muted-foreground">Solo letras, números, guiones y guiones bajos (3-30 caracteres)</p>
            </div>

            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input
                value={editingUser?.email || ""}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">El correo no se puede modificar</p>
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={(v: "admin" | "empleado") => setEditRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="empleado">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Empleado
                    </span>
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrador
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim() || !!usernameError}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirmation */}
      <AlertDialog open={!!togglingUser} onOpenChange={() => setTogglingUser(null)}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {togglingUser?.is_active ? "¿Desactivar usuario?" : "¿Activar usuario?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {togglingUser?.is_active 
                ? `El usuario "${togglingUser?.full_name}" no podrá acceder al sistema mientras esté desactivado.`
                : `El usuario "${togglingUser?.full_name}" podrá acceder al sistema nuevamente.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={cn(
                togglingUser?.is_active 
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                  : "bg-success text-success-foreground hover:bg-success/90"
              )}
            >
              {togglingUser?.is_active ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
      />
    </MainLayout>
  );
}
