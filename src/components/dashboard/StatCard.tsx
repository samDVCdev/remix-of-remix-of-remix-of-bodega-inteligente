import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default", trend }: StatCardProps) {
  const variants = {
    default: "stat-card",
    primary: "stat-card-accent",
    success: "stat-card bg-success/5 border-success/20",
    warning: "stat-card bg-warning/5 border-warning/20",
  };

  const iconVariants = {
    default: "bg-primary/10 text-primary",
    primary: "bg-primary-foreground/20 text-primary-foreground",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
  };

  const textVariants = {
    default: "text-foreground",
    primary: "text-primary-foreground",
    success: "text-foreground",
    warning: "text-foreground",
  };

  return (
    <div className={cn(variants[variant], "animate-fade-in min-w-0")}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p
            className={cn(
              "text-xs sm:text-sm font-medium truncate",
              variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {title}
          </p>
          <p className={cn("text-lg sm:text-2xl lg:text-3xl font-display font-bold truncate", textVariants[variant])}>
            {value}
          </p>
          {subtitle && (
            <p
              className={cn(
                "text-xs sm:text-sm md:text-xl truncate",
                variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn("text-xs sm:text-sm font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </p>
          )}
        </div>
        <div className={cn("p-2 sm:p-3 rounded-xl shrink-0", iconVariants[variant])}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
