import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  BarChart3,
  CreditCard,
  Settings,
  Users,
  FileText,
  LogOut,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CurrencyToggle } from "./CurrencyToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logoKiosko from "@/assets/logo-kiosko.png";

const adminNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cuentas por Cobrar", href: "/cuentas-por-cobrar", icon: CreditCard },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
];

const settingsSubNav = [
  { name: "Moneda", href: "/moneda", icon: DollarSign },
  { name: "Usuarios", href: "/usuarios", icon: Users },
  { name: "Auditoría", href: "/auditoria", icon: FileText },
  
];

const employeeNavigation = [
  { name: "Cuentas por Cobrar", href: "/cuentas-por-cobrar", icon: CreditCard },
];

const ventasSubNav = [
  { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
  { name: "Historial Ventas", href: "/ventas", icon: FileText },
];

const productosSubNav = [
  { name: "Catálogo", href: "/productos", icon: Package },
  { name: "Movimientos", href: "/movimientos-inventario", icon: BarChart3 },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, profile, signOut } = useAuth();
  const [ventasOpen, setVentasOpen] = useState(
    ventasSubNav.some(item => location.pathname === item.href)
  );
  const [productosOpen, setProductosOpen] = useState(
    productosSubNav.some(item => location.pathname === item.href)
  );
  const [settingsOpen, setSettingsOpen] = useState(
    settingsSubNav.some(item => location.pathname === item.href)
  );
  
  const navigation = isAdmin ? adminNavigation : employeeNavigation;

  const renderSubmenu = (
    label: string,
    Icon: any,
    items: typeof ventasSubNav,
    isOpen: boolean,
    setOpen: (v: boolean) => void
  ) => (
    <div>
      <button
        onClick={() => setOpen(!isOpen)}
        className={cn(
          "nav-link w-full justify-between",
          items.some(s => location.pathname === s.href) && "nav-link-active"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onMobileClose}
                className={cn(
                  "nav-link text-sm",
                  isActive && "nav-link-active"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

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
        {/* Dashboard link (admin only, first item) */}
        {isAdmin && (() => {
          const dashItem = adminNavigation[0];
          const isActive = location.pathname === dashItem.href;
          return (
            <Link
              to={dashItem.href}
              onClick={onMobileClose}
              className={cn("nav-link", isActive && "nav-link-active")}
            >
              <dashItem.icon className="w-5 h-5" />
              <span>{dashItem.name}</span>
            </Link>
          );
        })()}

        {/* Ventas submenu */}
        {renderSubmenu("Ventas", ShoppingCart, ventasSubNav, ventasOpen, setVentasOpen)}

        {/* Productos submenu */}
        {renderSubmenu("Productos", Package, productosSubNav, productosOpen, setProductosOpen)}

        {/* Remaining nav items (Cuentas por Cobrar, Reportes) */}
        {navigation.filter((_, i) => isAdmin ? i > 0 : true).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onMobileClose}
              className={cn("nav-link", isActive && "nav-link-active")}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Settings submenu - admin only */}
        {isAdmin && renderSubmenu("Configuración", Settings, settingsSubNav, settingsOpen, setSettingsOpen)}
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