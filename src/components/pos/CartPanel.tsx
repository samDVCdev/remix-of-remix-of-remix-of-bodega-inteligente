import { X, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types/inventory";
import { useCurrency } from "@/hooks/useCurrency";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartPanelProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onCreditSale: () => void;
  total: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CartPanel({
  items,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onCreditSale,
  total,
  isOpen,
  onClose
}: CartPanelProps) {
  const { exchangeRate } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Mi Carrito</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items */}
        <ScrollArea className="flex-1 p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-muted/30 rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{item.display_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.grams 
                          ? `${item.grams}gr × $${item.unit_price.toFixed(4)}/gr`
                          : `${item.quantity} × $${item.unit_price.toFixed(2)}`
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">${item.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Bs. {(item.total * exchangeRate).toFixed(2)}
                      </p>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-destructive text-sm hover:underline mt-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-4 bg-card">
          {/* Total */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total USD:</span>
              <span className="text-3xl font-display font-bold text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Bs:</span>
              <span className="text-xl font-display font-bold text-foreground">
                Bs. {(total * exchangeRate).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          {items.length > 0 && (
            <div className="space-y-3">
              <Button
                onClick={onCheckout}
                className="w-full touch-button bg-primary"
              >
                Cobrar Contado
              </Button>
              <Button
                onClick={onCreditSale}
                variant="outline"
                className="w-full touch-button border-warning text-warning hover:bg-warning hover:text-warning-foreground"
              >
                Registrar Fiao
              </Button>
            </div>
          )}

          {/* Clear cart */}
          {items.length > 0 && (
            <Button
              variant="ghost"
              onClick={onClearCart}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vaciar carrito
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
