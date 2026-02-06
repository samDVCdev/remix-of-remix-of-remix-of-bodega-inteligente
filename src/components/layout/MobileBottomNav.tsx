import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, CreditCard, MoreHorizontal, X, LayoutDashboard, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  isCenter?: boolean;
  isMore?: boolean;
}

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { isAdmin } = useAuth();

  // Employee nav: Productos, POS (center), Ventas, Cuentas
  const employeeNavItems: NavItem[] = [
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Vender", href: "/pos", icon: ShoppingCart, isCenter: true },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Cuentas", href: "/cuentas-por-cobrar", icon: CreditCard },
  ];

  // Admin nav: Dashboard, Productos, POS (center), Ventas, Más
  const adminNavItems: NavItem[] = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Vender", href: "/pos", icon: ShoppingCart, isCenter: true },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Más", href: "#more", icon: MoreHorizontal, isMore: true },
  ];

  const moreMenuItems = [
    { name: "Cuentas por Cobrar", href: "/cuentas-por-cobrar" },
    { name: "Reportes", href: "/reportes" },
    { name: "Configuración", href: "/usuarios", isHeader: true },
    { name: "Usuarios", href: "/usuarios" },
    { name: "Auditoría", href: "/auditoria" },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleCenterClick = () => {
    navigate("/pos");
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <button
                  key={item.name}
                  onClick={handleCenterClick}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                    location.pathname === "/pos" 
                      ? "bg-primary ring-4 ring-primary/20" 
                      : "bg-primary"
                  )}>
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-primary">
                    {item.name}
                  </span>
                </button>
              );
            }

            if (item.isMore) {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
                    isMoreOpen
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu Overlay */}
      {isMoreOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMoreOpen(false)}
        >
          <div 
            className="absolute bottom-20 left-4 right-4 bg-card rounded-xl border border-border shadow-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Más opciones</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreMenuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    "p-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}