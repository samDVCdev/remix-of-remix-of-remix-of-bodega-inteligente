import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert, Lock, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProductsWithVariants } from "@/hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DangerZonePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: products } = useProductsWithVariants();

  // Password gate
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Multi-step delete
  const [deleteAllStep, setDeleteAllStep] = useState(0);
  const [deleteAllInput, setDeleteAllInput] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleVerifyPassword = async () => {
    if (!user?.email || !password) return;
    setIsVerifying(true);
    setAuthError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        setAuthError("Contraseña incorrecta");
      } else {
        setIsAuthenticated(true);
      }
    } catch {
      setAuthError("Error al verificar la contraseña");
    } finally {
      setIsVerifying(false);
      setPassword("");
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-variants"] });
      toast.success("Todos los productos han sido eliminados");
    } catch {
      toast.error("Error al eliminar los productos");
    } finally {
      setIsDeletingAll(false);
      setDeleteAllStep(0);
      setDeleteAllInput("");
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="stat-card max-w-md w-full p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-xl font-display font-bold text-foreground">Zona Restringida</h1>
              <p className="text-sm text-muted-foreground">
                Ingresa tu contraseña de administrador para acceder a las opciones peligrosas.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Contraseña del administrador"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
              />
              {authError && (
                <p className="text-sm text-destructive text-center">{authError}</p>
              )}
              <Button
                onClick={handleVerifyPassword}
                disabled={!password || isVerifying}
                className="w-full"
              >
                {isVerifying ? "Verificando..." : "Verificar identidad"}
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
            </div>
            Zona Peligrosa
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Acciones irreversibles. Procede con extrema precaución.
          </p>
        </div>

        {/* Delete all products card */}
        <div className="stat-card border-destructive/30 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 shrink-0">
              <Package className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Eliminar todos los productos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Eliminará <strong>{products?.length || 0} productos</strong> del sistema, incluyendo sus variantes y equivalencias.
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={() => setDeleteAllStep(1)}
              disabled={!products?.length}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar todos los productos
            </Button>
          </div>
        </div>
      </div>

      {/* Step 1: First warning */}
      <AlertDialog open={deleteAllStep === 1} onOpenChange={() => { setDeleteAllStep(0); setDeleteAllInput(""); }}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ¿Eliminar TODOS los productos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar <strong>{products?.length || 0} productos</strong> del sistema.
              Esta acción es <strong>irreversible</strong> y eliminará también sus variantes y equivalencias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteAllStep(2)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Entiendo, continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Type confirmation */}
      <AlertDialog open={deleteAllStep === 2} onOpenChange={() => { setDeleteAllStep(0); setDeleteAllInput(""); }}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmación de seguridad
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Para confirmar, escribe <strong className="text-foreground">ELIMINAR TODO</strong> en el campo de abajo:</p>
                <Input
                  value={deleteAllInput}
                  onChange={(e) => setDeleteAllInput(e.target.value)}
                  placeholder="Escribe ELIMINAR TODO"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDeleteAllStep(3)}
              disabled={deleteAllInput !== "ELIMINAR TODO"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 3: Final confirmation */}
      <AlertDialog open={deleteAllStep === 3} onOpenChange={() => { setDeleteAllStep(0); setDeleteAllInput(""); }}>
        <AlertDialogContent className="bg-card mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Última confirmación
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán <strong>{products?.length || 0} productos</strong> permanentemente.
              ¿Estás completamente seguro? No hay vuelta atrás.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAll ? "Eliminando..." : "Sí, eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}