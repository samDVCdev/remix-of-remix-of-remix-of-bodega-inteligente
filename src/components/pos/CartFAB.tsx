import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartFABProps {
  itemCount: number;
  onClick: () => void;
}

export function CartFAB({ itemCount, onClick }: CartFABProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 w-16 h-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-40"
    >
      <ShoppingCart className="w-7 h-7" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Button>
  );
}