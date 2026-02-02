import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ShoppingCart,
  BarChart3,
  CreditCard,
  Users,
  FileText,
  LogOut,
  Tags
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyToggle } from "./CurrencyToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logoKiosko from "@/assets/logo-kiosko.png";

const adminNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Categorías", href: "/categorias", icon: Tags },
  { name: "Entradas", href: "/entradas", icon: ArrowDownToLine },
  { name: "Historial Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Cuentas por Cobrar", href: "/cuentas-por-cobrar", icon: CreditCard },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
  { name: "Usuarios", href: "/usuarios", icon: Users },
  { name: "Auditoría", href: "/auditoria", icon: FileText },
];

const employeeNavigation = [
  { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Historial Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Cuentas por Cobrar", href: "/cuentas-por-cobrar", icon: CreditCard },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, profile, signOut } = useAuth();
  
  const navigation = isAdmin ? adminNavigation : employeeNavigation;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300",
      "lg:translate-x-0",
      isMobileOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to={isAdmin ? "/" : "/pos"} className="flex items-center gap-3" onClick={onMobileClose}>
          <img 
            src={logoKiosko} 
            alt="Kiosko" 
            className="w-12 h-12 rounded-xl object-cover"
          />
          <div>
            <h1 className="font-display text-xl font-bold text-sidebar-foreground">Kiosko</h1>
            <p className="text-xs text-sidebar-foreground/60">
              {profile?.full_name || "Punto de Venta"}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onMobileClose}
              className={cn(
                "nav-link",
                isActive && "nav-link-active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex justify-center">
          <CurrencyToggle />
        </div>
        <Button 
          variant="ghost" 
          onClick={signOut}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
        <p className="text-xs text-sidebar-foreground/50 text-center">
          {isAdmin ? "Administrador" : "Empleado"} · Kiosko © 2024
        </p>
      </div>
    </aside>
  );
}