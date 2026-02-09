import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, CreditCard, MoreHorizontal, X, LayoutDashboard, List, BarChart3, Users, Shield } from "lucide-react";
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
  const { isAdmin } = useAuth();

  const employeeNavItems: NavItem[] = [
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Vender", href: "/pos", icon: ShoppingCart, isCenter: true },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Cuentas", href: "/cuentas-por-cobrar", icon: CreditCard },
  ];

  const adminNavItems: NavItem[] = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Productos", href: "/productos", icon: Package },
    { name: "Vender", href: "/pos", icon: ShoppingCart, isCenter: true },
    { name: "Ventas", href: "/ventas", icon: List },
    { name: "Más", href: "#more", icon: MoreHorizontal, isMore: true },
  ];

  const moreMenuItems = [
    { name: "Cuentas por Cobrar", href: "/cuentas-por-cobrar", icon: CreditCard },
    { name: "Reportes", href: "/reportes", icon: BarChart3 },
    { name: "Usuarios", href: "/usuarios", icon: Users },
    { name: "Auditoría", href: "/auditoria", icon: Shield },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleCenterClick = () => {
    navigate("/pos");
  };

  return (
    <>
      {/* Bottom Sheet Overlay + Panel */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMoreOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-[0_-8px_30px_-6px_hsl(var(--foreground)/0.12)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/25" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 pt-1">
                <h3 className="text-base font-semibold text-foreground tracking-tight">Más opciones</h3>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-3 px-5 pb-8">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                        isActive
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "bg-muted/50 text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
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
    </>
  );
}
