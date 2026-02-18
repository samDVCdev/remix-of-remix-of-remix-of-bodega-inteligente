import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AtSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoKiosko from "@/assets/logo-kiosko.png";

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(255, "Demasiado largo"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
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
      navigate("/");
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
