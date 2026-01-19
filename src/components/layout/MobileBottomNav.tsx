import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, Plus, ArrowDownToLine, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiSaleDialog } from "@/components/sales/MultiSaleDialog";

const navItems = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Venta", href: "#sale", icon: Plus, isCenter: true },
  { name: "Entradas", href: "/entradas", icon: ArrowDownToLine },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [isSaleOpen, setIsSaleOpen] = useState(false);

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
                  onClick={() => setIsSaleOpen(true)}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-primary">
                    {item.name}
                  </span>
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

      <MultiSaleDialog open={isSaleOpen} onOpenChange={setIsSaleOpen} />
    </>
  );
}
