import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ShoppingCart,
  BarChart3,
  Warehouse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyToggle } from "./CurrencyToggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Entradas", href: "/entradas", icon: ArrowDownToLine },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300",
      "lg:translate-x-0",
      isMobileOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3" onClick={onMobileClose}>
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-sidebar-foreground">B0</h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de Inventario</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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

      {/* Currency Toggle & Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex justify-center">
          <CurrencyToggle />
        </div>
        <p className="text-xs text-sidebar-foreground/50 text-center">
          Bodega B0 © 2024
        </p>
      </div>
    </aside>
  );
}
