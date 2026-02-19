import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OfflineMutation {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  data: any;
  timestamp: number;
}

const QUEUE_KEY = "kiosko_offline_queue";

export function getOfflineQueue(): OfflineMutation[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(mutation: Omit<OfflineMutation, "id" | "timestamp">) {
  const queue = getOfflineQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent("offline-queue-change"));
}

function removeFromQueue(id: string) {
  const queue = getOfflineQueue().filter((m) => m.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent("offline-queue-change"));
}

export function clearOfflineQueue() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent("offline-queue-change"));
}

async function executeMutation(mutation: OfflineMutation): Promise<void> {
  const table = mutation.table as any;
  
  if (mutation.operation === "insert") {
    const { error } = await (supabase.from(table) as any).insert(mutation.data);
    if (error) throw error;
  } else if (mutation.operation === "update") {
    const { id: recordId, ...updateData } = mutation.data;
    const { error } = await (supabase.from(table) as any).update(updateData).eq("id", recordId);
    if (error) throw error;
  } else if (mutation.operation === "delete") {
    const { error } = await (supabase.from(table) as any).delete().eq("id", mutation.data.id);
    if (error) throw error;
  }
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      await executeMutation(mutation);
      removeFromQueue(mutation.id);
      synced++;
    } catch (error) {
      console.error("Error syncing offline mutation:", error);
      failed++;
    }
  }

  return { synced, failed };
}

// Auto-sync when coming back online
export function setupOfflineSync() {
  const handleOnline = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    toast.info(`Sincronizando ${queue.length} operación(es) pendiente(s)...`);
    
    const { synced, failed } = await syncOfflineQueue();
    
    if (synced > 0) {
      toast.success(`${synced} operación(es) sincronizada(s)`);
      window.dispatchEvent(new CustomEvent("offline-sync-complete"));
    }
    if (failed > 0) {
      toast.error(`${failed} operación(es) fallaron al sincronizar`);
    }
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}
