import { Store, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBusinessStatus, useToggleBusinessStatus } from "@/hooks/useBusinessStatus";
import { cn } from "@/lib/utils";

export function BusinessStatusToggle() {
  const { data: status, isLoading } = useBusinessStatus();
  const toggleStatus = useToggleBusinessStatus();

  if (isLoading) {
    return (
      <div className="stat-card p-4 animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  const isOpen = status?.is_open ?? false;

  return (
    <div className={cn(
      "stat-card p-4 transition-colors",
      isOpen ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            isOpen ? "bg-success/20" : "bg-destructive/20"
          )}>
            <Store className={cn(
              "w-5 h-5",
              isOpen ? "text-success" : "text-destructive"
            )} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm">
              {isOpen ? "Negocio Abierto" : "Negocio Cerrado"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isOpen 
                ? "Los empleados pueden registrar ventas" 
                : "Ventas deshabilitadas"
              }
            </p>
          </div>
        </div>
        <Button
          variant={isOpen ? "destructive" : "default"}
          size="sm"
          onClick={() => toggleStatus.mutate({ isOpen: !isOpen })}
          disabled={toggleStatus.isPending}
          className="gap-2 shrink-0"
        >
          {isOpen ? (
            <>
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
