import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, CreditCard, MoreHorizontal, LayoutDashboard, List, BarChart3, Users, Shield, ChevronUp, LogOut, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const { isAdmin, signOut, profile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMoreOpen(false);
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const employeeNavItems: NavItem[] = [
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Vender", href: "/pos", icon: ShoppingCart, isCenter: true },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Más", href: "#more", icon: MoreHorizontal, isMore: true },
  ];

  const adminNavItems: NavItem[] = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Vender", href: "/pos", icon: ShoppingCart, isCenter: true },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Más", href: "#more", icon: MoreHorizontal, isMore: true },
  ];

  const employeeModules = [
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Cuentas", href: "/cuentas-por-cobrar", icon: CreditCard },
    { name: "Movimientos", href: "/movimientos-inventario", icon: List },
  ];

  const adminModules = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Movimientos", href: "/movimientos-inventario", icon: List },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Reportes", href: "/reportes", icon: BarChart3 },
    { name: "Cuentas", href: "/cuentas-por-cobrar", icon: CreditCard },
    { name: "Moneda", href: "/moneda", icon: DollarSign },
    { name: "Usuarios", href: "/usuarios", icon: Users },
    { name: "Auditoría", href: "/auditoria", icon: Shield },
  ];

  const allModules = isAdmin ? adminModules : employeeModules;

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleCenterClick = () => {
    navigate("/pos");
  };

  // Shared nav bar row (used both standalone and inside bottom sheet)
  const renderNavRow = () => (
    <div className="flex items-center justify-around h-16 px-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <button
              key={item.name}
              onClick={() => { setIsMoreOpen(false); handleCenterClick(); }}
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
              <span className="text-[10px] mt-1 font-semibold uppercase tracking-wide text-primary">
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
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-lg transition-colors",
                isMoreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isMoreOpen ? (
                <>
                  <span className="text-[10px] font-medium text-primary">Cerrar</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </>
              )}
            </button>
          );
        }

        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setIsMoreOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Expanded Bottom Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMoreOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[28px] shadow-[0_-10px_40px_-8px_hsl(var(--foreground)/0.15)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3">
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
              </div>

              {/* Nav row inside the sheet */}
              {renderNavRow()}

              {/* Divider + Title */}
              <div className="px-6 pb-2 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Todos los módulos
                </p>
              </div>

              {/* Modules Grid - 3 columns like the reference */}
              <div className="grid grid-cols-3 gap-y-5 gap-x-2 px-6 pb-8 pt-2">
                {allModules.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                        isActive
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : "bg-muted/60"
                      )}>
                        <Icon className={cn(
                          "w-6 h-6",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Logout button */}
              <div className="px-6 pb-8 pt-2 border-t border-border/50">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <div className="text-left">
                    <span className="text-sm font-medium">Cerrar sesión</span>
                    {profile?.full_name && (
                      <p className="text-[11px] text-muted-foreground">{profile.full_name}</p>
                    )}
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Default Bottom Nav (hidden when sheet is open) */}
      {!isMoreOpen && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
          {renderNavRow()}
        </nav>
      )}
    </>
  );
}
