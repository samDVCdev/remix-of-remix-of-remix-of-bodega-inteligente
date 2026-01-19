import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface ExchangeRate {
  rate: number;
  lastUpdated: string;
}

interface CurrencyContextType {
  currency: "VES" | "USD";
  setCurrency: (currency: "VES" | "USD") => void;
  exchangeRate: number;
  isLoading: boolean;
  formatPrice: (usdAmount: number) => string;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Fetch USD to VES exchange rate from a public API
async function fetchExchangeRate(): Promise<ExchangeRate> {
  try {
    // Using exchangerate-api.com free tier (or similar)
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }
    
    const data = await response.json();
    const vesRate = data.rates?.VES || 36.5; // Fallback rate if API doesn't have VES
    
    return {
      rate: vesRate,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Fallback rate (approximate)
    return {
      rate: 36.5,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<"VES" | "USD">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("currency") as "VES" | "USD") || "VES";
    }
    return "VES";
  });

  const { data: exchangeData, isLoading } = useQuery({
    queryKey: ["exchange-rate"],
    queryFn: fetchExchangeRate,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const exchangeRate = exchangeData?.rate || 36.5;

  const formatPrice = (usdAmount: number): string => {
    if (currency === "USD") {
      return `$${usdAmount.toFixed(2)}`;
    }
    const vesAmount = usdAmount * exchangeRate;
    return `Bs. ${vesAmount.toFixed(2)}`;
  };

  const currencySymbol = currency === "USD" ? "$" : "Bs.";

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRate,
        isLoading,
        formatPrice,
        currencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    // Return default values if used outside provider
    return {
      currency: "VES" as const,
      setCurrency: () => {},
      exchangeRate: 36.5,
      isLoading: false,
      formatPrice: (usdAmount: number) => `Bs. ${(usdAmount * 36.5).toFixed(2)}`,
      currencySymbol: "Bs.",
    };
  }
  return context;
}
