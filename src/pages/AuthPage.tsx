import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AtSign, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoKiosko from "@/assets/logo-kiosko.png";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(255, "Demasiado largo"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, user, isAdmin, isLoading: authLoading, role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [noUsers, setNoUsers] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Check if there are any users in the system
  useEffect(() => {
    const checkUsers = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (count === 0) {
        setNoUsers(true);
        setShowRegister(true);
      }
    };
    checkUsers();
  }, []);

  // Redirect authenticated users based on role
  useEffect(() => {
    if (user && role) {
      navigate(isAdmin ? "/" : "/pos", { replace: true });
    }
  }, [user, role, isAdmin, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const identifier = data.identifier.trim().toLowerCase();
      let emailToUse = identifier;

      // If not an email, look up by username
      if (!identifier.includes("@")) {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-email-by-identifier`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier }),
          }
        );
        const result = await res.json();
        if (!res.ok) {
          toast.error("Usuario no encontrado");
          setIsLoading(false);
          return;
        }
        emailToUse = result.email;
      }

      await signIn(emailToUse, data.password);
      toast.success("¡Bienvenido!");
    } catch (error: any) {
      const msg = error.message || "";
      if (msg === "USER_DEACTIVATED") {
        toast.error("Tu cuenta está desactivada. Contacta al administrador.");
      } else if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        toast.error("Credenciales incorrectas");
      } else {
        toast.error("Error al iniciar sesión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName);
      toast.success("¡Cuenta creada! Iniciando sesión...");
      // Auto sign in after registration
      await signIn(data.email, data.password);
    } catch (error: any) {
      toast.error(error.message || "Error al crear cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegister) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img
              src={logoKiosko}
              alt="Kiosko"
              className="w-32 h-32 mx-auto rounded-2xl object-cover mb-4"
            />
            <CardTitle className="font-display text-2xl">Configuración Inicial</CardTitle>
            <CardDescription>
              {noUsers
                ? "No hay usuarios registrados. Crea la cuenta de administrador."
                : "Crear nueva cuenta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Juan Pérez" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" placeholder="correo@ejemplo.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="password" placeholder="Mínimo 6 caracteres" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta de Administrador"}
                </Button>
                {!noUsers && (
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowRegister(false)}>
                    Ya tengo cuenta
                  </Button>
                )}
              </form>
            </Form>
            {noUsers && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                Este será el primer administrador del sistema
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src={logoKiosko}
            alt="Kiosko"
            className="w-32 h-32 mx-auto rounded-2xl object-cover mb-4"
          />
          <CardTitle className="font-display text-2xl">Kiosko</CardTitle>
          <CardDescription>Tu inventario de confianza</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario o Correo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="usuario o correo@ejemplo.com"
                          className="pl-10"
                          autoComplete="username"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="pl-10"
                          autoComplete="current-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Cargando..." : "Iniciar Sesión"}
              </Button>
            </form>
          </Form>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Contacta al administrador para obtener acceso
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
