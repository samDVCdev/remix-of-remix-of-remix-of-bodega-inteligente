import { useState, useEffect } from "react";
import { Wifi, WifiOff, Loader2, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowOnlineBanner(true);
        setTimeout(() => setShowOnlineBanner(false), 4000);
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowOnlineBanner(false);
    };

    const checkNetworkSpeed = () => {
      const connection = (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      if (connection) {
        const isSlow =
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g" ||
          connection.downlink < 1;
        setIsSlowNetwork(isSlow);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    checkNetworkSpeed();

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener("change", checkNetworkSpeed);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", checkNetworkSpeed);
      }
    };
  }, [wasOffline]);

  // Always show when offline
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground shadow-lg animate-fade-in">
        <div className="flex items-center justify-center gap-3 py-2.5 px-4">
          <CloudOff className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Modo Offline</span>
          <span className="text-xs opacity-80">— Los datos se cargan desde la caché local</span>
        </div>
      </div>
    );
  }

  // Show "connection restored" briefly
  if (showOnlineBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-success text-success-foreground shadow-lg animate-fade-in">
        <div className="flex items-center justify-center gap-3 py-2.5 px-4">
          <Wifi className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Conexión restaurada</span>
          <span className="text-xs opacity-80">— Sincronizando datos...</span>
        </div>
      </div>
    );
  }

  // Show slow network warning
  if (isSlowNetwork) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground shadow-lg">
        <div className="flex items-center justify-center gap-2 py-2 px-4">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-sm font-medium">Conexión lenta detectada</span>
        </div>
      </div>
    );
  }

  return null;
}
