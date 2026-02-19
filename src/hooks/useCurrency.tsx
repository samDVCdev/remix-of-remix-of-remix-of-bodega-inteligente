import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type RateMode = "bcv" | "manual";

interface CurrencyContextType {
  currency: "VES" | "USD";
  setCurrency: (currency: "VES" | "USD") => void;
  exchangeRate: number;
  isLoading: boolean;
  formatPrice: (usdAmount: number) => string;
  formatDualPrice: (usdAmount: number) => { usd: string; ves: string };
  currencySymbol: string;
  rateMode: RateMode;
  setRateMode: (mode: RateMode) => void;
  manualRate: number;
  setManualRate: (rate: number) => void;
  savingRate: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

async function fetchBCVRate(): Promise<number> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    return data.rates?.VES || 36.5;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 36.5;
  }
}

async function fetchDbSettings() {
  const { data, error } = await supabase
    .from("currency_settings")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [currency, setCurrency] = useState<"VES" | "USD">(() => {
    return (localStorage.getItem("currency") as "VES" | "USD") || "VES";
  });

  // Fetch settings from DB
  const { data: dbSettings } = useQuery({
    queryKey: ["currency-settings"],
    queryFn: fetchDbSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const rateMode: RateMode = (dbSettings?.rate_mode as RateMode) || "bcv";
  const manualRate: number = dbSettings?.manual_rate ? Number(dbSettings.manual_rate) : 36.5;

  const { data: bcvRate, isLoading } = useQuery({
    queryKey: ["exchange-rate-bcv"],
    queryFn: fetchBCVRate,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    enabled: rateMode === "bcv",
  });

  // Mutation to save settings to DB
  const updateSettings = useMutation({
    mutationFn: async (params: { rate_mode?: string; manual_rate?: number }) => {
      const { data: existing } = await supabase
        .from("currency_settings")
        .select("id")
        .limit(1)
        .single();

      if (!existing) throw new Error("No settings row found");

      const { error } = await supabase
        .from("currency_settings")
        .update({ ...params, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currency-settings"] });
    },
  });

  useEffect(() => { localStorage.setItem("currency", currency); }, [currency]);

  const setRateMode = (mode: RateMode) => {
    updateSettings.mutate({ rate_mode: mode });
  };

  const setManualRate = (rate: number) => {
    updateSettings.mutate({ manual_rate: rate, rate_mode: "manual" });
  };

  const exchangeRate = rateMode === "bcv" ? (bcvRate || 36.5) : manualRate;

  const formatPrice = (usdAmount: number): string => {
    if (currency === "USD") return `$${usdAmount.toFixed(2)}`;
    return `Bs. ${(usdAmount * exchangeRate).toFixed(2)}`;
  };

  const formatDualPrice = (usdAmount: number) => ({
    usd: `$${usdAmount.toFixed(2)}`,
    ves: `Bs. ${(usdAmount * exchangeRate).toFixed(2)}`,
  });

  const currencySymbol = currency === "USD" ? "$" : "Bs.";

  return (
    <CurrencyContext.Provider
      value={{
        currency, setCurrency, exchangeRate, isLoading,
        formatPrice, formatDualPrice, currencySymbol,
        rateMode, setRateMode, manualRate, setManualRate,
        savingRate: updateSettings.isPending,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    return {
      currency: "VES" as const,
      setCurrency: () => {},
      exchangeRate: 36.5,
      isLoading: false,
      formatPrice: (usdAmount: number) => `Bs. ${(usdAmount * 36.5).toFixed(2)}`,
      formatDualPrice: (usdAmount: number) => ({
        usd: `$${usdAmount.toFixed(2)}`,
        ves: `Bs. ${(usdAmount * 36.5).toFixed(2)}`,
      }),
      currencySymbol: "Bs.",
      rateMode: "bcv" as const,
      setRateMode: () => {},
      manualRate: 36.5,
      setManualRate: () => {},
      savingRate: false,
    };
  }
  return context;
}
