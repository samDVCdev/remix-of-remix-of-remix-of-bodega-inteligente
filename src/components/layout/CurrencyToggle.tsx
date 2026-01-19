import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

export function CurrencyToggle() {
  const { currency, setCurrency, exchangeRate, isLoading } = useCurrency();

  const toggleCurrency = () => {
    setCurrency(currency === "VES" ? "USD" : "VES");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCurrency}
      className={cn(
        "gap-2 text-xs font-medium",
        "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      )}
      disabled={isLoading}
    >
      <DollarSign className="w-4 h-4" />
      <span className="hidden sm:inline">
        {currency === "VES" ? `Bs. (1 USD = ${exchangeRate.toFixed(2)} Bs.)` : "USD"}
      </span>
      <span className="sm:hidden">{currency}</span>
    </Button>
  );
}
