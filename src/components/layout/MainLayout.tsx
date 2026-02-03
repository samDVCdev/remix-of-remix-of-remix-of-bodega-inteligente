import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { NetworkStatus } from "./NetworkStatus";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Network Status Indicator */}
      <NetworkStatus />
      
      {/* Sidebar - desktop only */}
      <Sidebar />

      {/* Main Content */}
      <main className="relative lg:ml-64 pb-20 lg:pb-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
