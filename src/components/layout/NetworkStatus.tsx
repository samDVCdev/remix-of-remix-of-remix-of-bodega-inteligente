import { useState, useEffect } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    // Check network speed
    const checkNetworkSpeed = () => {
      const connection = (navigator as any).connection || 
                         (navigator as any).mozConnection || 
                         (navigator as any).webkitConnection;
      
      if (connection) {
        const isSlow = connection.effectiveType === 'slow-2g' || 
                       connection.effectiveType === '2g' ||
                       connection.downlink < 1;
        setIsSlowNetwork(isSlow);
        if (isSlow) setShowStatus(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    setIsOnline(navigator.onLine);
    checkNetworkSpeed();

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', checkNetworkSpeed);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', checkNetworkSpeed);
      }
    };
  }, []);

  if (!showStatus && isOnline && !isSlowNetwork) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[100] flex items-center justify-center py-2 px-4 text-sm font-medium transition-all duration-300",
      !isOnline && "bg-destructive text-destructive-foreground",
      isOnline && isSlowNetwork && "bg-warning text-warning-foreground",
      isOnline && !isSlowNetwork && "bg-success text-success-foreground"
    )}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Sin conexión a internet</span>
          </>
        ) : isSlowNetwork ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Conexión lenta detectada</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4" />
            <span>Conexión restaurada</span>
          </>
        )}
      </div>
    </div>
  );
}
