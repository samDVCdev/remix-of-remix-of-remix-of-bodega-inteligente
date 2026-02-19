import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupOfflineSync } from "@/lib/offlineQueue";

// Setup auto-sync for offline mutations
setupOfflineSync();

createRoot(document.getElementById("root")!).render(<App />);
