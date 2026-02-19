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

  const bannerConfig = !isOnline
    ? {
        icon: CloudOff,
        label: "Sin conexión",
        detail: "Datos desde caché",
        className: "bg-destructive/10 border-destructive/30 text-destructive",
        iconSpin: false,
      }
    : showOnlineBanner
    ? {
        icon: Wifi,
        label: "Conexión restaurada",
        detail: "Sincronizando...",
        className: "bg-success/10 border-success/30 text-success",
        iconSpin: false,
      }
    : isSlowNetwork
    ? {
        icon: Loader2,
        label: "Red lenta",
        detail: null,
        className: "bg-warning/10 border-warning/30 text-warning",
        iconSpin: true,
      }
    : null;

  if (!bannerConfig) return null;

  const { icon: BannerIcon, label, detail, className, iconSpin } = bannerConfig;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] animate-fade-in max-w-[95vw] sm:max-w-sm">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm text-xs font-medium",
          className
        )}
      >
        <BannerIcon className={cn("w-3.5 h-3.5 shrink-0", iconSpin && "animate-spin")} />
        <span>{label}</span>
        {detail && (
          <span className="opacity-70 hidden sm:inline">— {detail}</span>
        )}
      </div>
    </div>
  );
}
