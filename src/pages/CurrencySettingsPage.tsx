import { useState, useEffect } from "react";
import { DollarSign, RefreshCw, Edit3 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CurrencySettingsPage() {
  const { rateMode, setRateMode, manualRate, setManualRate, exchangeRate, isLoading, savingRate } = useCurrency();
  const [tempRate, setTempRate] = useState(String(manualRate));

  // Sync tempRate when manualRate changes from DB
  useEffect(() => {
    setTempRate(String(manualRate));
  }, [manualRate]);

  const handleSaveManualRate = () => {
    const rate = parseFloat(tempRate);
    if (!rate || rate <= 0) {
      toast.error("Ingrese una tasa válida mayor a 0");
      return;
    }
    setManualRate(rate);
    toast.success(`Tasa manual actualizada: 1 USD = ${rate.toFixed(2)} Bs.`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            Configuración de Moneda
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configura la tasa de cambio USD/VES
          </p>
        </div>

        {/* Current rate display */}
        <div className="stat-card-accent p-6">
          <p className="text-primary-foreground/80 text-sm font-medium">Tasa Actual</p>
          <p className="text-3xl font-display font-bold text-primary-foreground mt-1">
            1 USD = {exchangeRate.toFixed(2)} Bs.
          </p>
          <p className="text-primary-foreground/60 text-xs mt-1">
            Modo: {rateMode === "bcv" ? "Automática (API)" : "Manual"}
          </p>
        </div>

        {/* Mode selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setRateMode("bcv")}
            className={cn(
              "stat-card p-5 text-left transition-all",
              rateMode === "bcv" && "ring-2 ring-primary"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-2 rounded-lg",
                rateMode === "bcv" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-foreground">Tasa Automática</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Obtiene la tasa de cambio automáticamente desde una API externa (similar a BCV).
            </p>
            {rateMode === "bcv" && (
              <p className="text-xs text-primary font-medium mt-2">
                {isLoading ? "Cargando..." : `Tasa actual: ${exchangeRate.toFixed(2)} Bs.`}
              </p>
            )}
          </button>

          <button
            onClick={() => setRateMode("manual")}
            className={cn(
              "stat-card p-5 text-left transition-all",
              rateMode === "manual" && "ring-2 ring-primary"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-2 rounded-lg",
                rateMode === "manual" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-foreground">Tasa Manual</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Define manualmente la tasa de cambio que deseas usar.
            </p>
          </button>
        </div>

        {/* Manual rate input */}
        {rateMode === "manual" && (
          <div className="stat-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-foreground">Establecer Tasa Manual</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">1 USD =</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="h-12 text-lg font-semibold"
                    placeholder="Ej: 45.50"
                  />
                  <span className="text-lg font-semibold text-muted-foreground whitespace-nowrap">Bs.</span>
                </div>
              </div>
            </div>
            <Button onClick={handleSaveManualRate} className="w-full sm:w-auto">
              Guardar Tasa
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
