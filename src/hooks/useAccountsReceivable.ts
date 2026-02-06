import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AccountReceivable {
  id: string;
  product_id: string;
  movement_date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  debt_percentage: number;
  customer_name: string | null;
  product_name: string | null;
  product_code: string | null;
  seller_name: string | null;
}

export interface DebtorSummary {
  customer_name: string;
  total_debt: number;
  amount_paid: number;
  debt_percentage: number;
}

export function useAccountsReceivable() {
  return useQuery({
    queryKey: ["accounts-receivable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select("*");
      
      if (error) throw error;
      return data as unknown as AccountReceivable[];
    },
  });
}

export function useDebtorsSummary() {
  return useQuery({
    queryKey: ["debtors-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select("*");
      
      if (error) throw error;
      
      const accounts = data as unknown as AccountReceivable[];
      
      const debtorMap = new Map<string, DebtorSummary>();
      
      accounts.forEach((account) => {
        const name = account.customer_name || "Sin nombre";
        const existing = debtorMap.get(name);
        
        if (existing) {
          existing.total_debt += Number(account.amount_due || account.total_amount);
          existing.amount_paid += Number(account.amount_paid || 0);
        } else {
          debtorMap.set(name, {
            customer_name: name,
            total_debt: Number(account.amount_due || account.total_amount),
            amount_paid: Number(account.amount_paid || 0),
            debt_percentage: 100,
          });
        }
      });
      
      const debtors = Array.from(debtorMap.values())
        .map((d) => ({
          ...d,
          debt_percentage: d.total_debt + d.amount_paid > 0 
            ? (d.total_debt / (d.total_debt + d.amount_paid)) * 100 
            : 0,
        }))
        .sort((a, b) => b.total_debt - a.total_debt);
      
      return debtors;
    },
  });
}

export function useRegisterPartialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      // Get current movement
      const { data: movements, error: fetchError } = await supabase
        .from("inventory_movements")
        .select("*")
        .eq("id", id);

      if (fetchError) throw fetchError;
      
      const movement = movements?.[0] as any;
      if (!movement) throw new Error("Movimiento no encontrado");

      const currentPaid = Number(movement.amount_paid || 0);
      const totalAmount = Number(movement.total_amount);
      const newAmountPaid = Math.min(currentPaid + amount, totalAmount);
      const isPaid = newAmountPaid >= totalAmount - 0.005; // floating point tolerance

      const updateData: Record<string, any> = { 
        amount_paid: newAmountPaid,
        is_paid: isPaid,
      };
      
      if (notes) {
        const existingNotes = movement.notes || "";
        updateData.notes = existingNotes 
          ? `${existingNotes} | ${notes}` 
          : notes;
      }

      const { error, count } = await supabase
        .from("inventory_movements")
        .update(updateData as any)
        .eq("id", id);
      
      if (error) throw error;

      // Log audit event
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from("audit_logs" as any)
          .insert({
            action: isPaid ? 'PAYMENT_COMPLETED' : 'PARTIAL_PAYMENT_REGISTERED',
            entity_type: 'inventory_movements',
            entity_id: id,
            user_id: user?.id,
            details: { movement_id: id, amount, new_total_paid: newAmountPaid, fully_paid: isPaid }
          });
      } catch (e) {
        // Don't fail the payment if audit log fails
        console.error("Audit log error:", e);
      }

      return { isPaid, newAmountPaid };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["debtors-summary"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      toast.success(result.isPaid ? "Deuda saldada completamente" : "Abono registrado exitosamente");
    },
    onError: (error) => {
      console.error("Payment error:", error);
      toast.error("Error al registrar el abono");
    },
  });
}
