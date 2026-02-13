import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";

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

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<"VES" | "USD">(() => {
    return (localStorage.getItem("currency") as "VES" | "USD") || "VES";
  });

  const [rateMode, setRateModeState] = useState<RateMode>(() => {
    return (localStorage.getItem("rateMode") as RateMode) || "bcv";
  });

  const [manualRate, setManualRateState] = useState<number>(() => {
    const saved = localStorage.getItem("manualRate");
    return saved ? parseFloat(saved) : 36.5;
  });

  const { data: bcvRate, isLoading } = useQuery({
    queryKey: ["exchange-rate-bcv"],
    queryFn: fetchBCVRate,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    enabled: rateMode === "bcv",
  });

  useEffect(() => { localStorage.setItem("currency", currency); }, [currency]);
  useEffect(() => { localStorage.setItem("rateMode", rateMode); }, [rateMode]);
  useEffect(() => { localStorage.setItem("manualRate", String(manualRate)); }, [manualRate]);

  const setRateMode = (mode: RateMode) => setRateModeState(mode);
  const setManualRate = (rate: number) => setManualRateState(rate);

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
    };
  }
  return context;
}
