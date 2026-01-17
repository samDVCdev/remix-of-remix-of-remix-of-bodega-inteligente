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

export function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  variant = "default",
  trend 
}: StatCardProps) {
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
    <div className={cn(variants[variant], "animate-fade-in")}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn("text-3xl font-display font-bold", textVariants[variant])}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm",
              variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconVariants[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
