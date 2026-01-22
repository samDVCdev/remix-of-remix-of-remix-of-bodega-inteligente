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
      
      // Group by customer
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
      
      // Calculate percentages and sort
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

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get current movement to update amount_paid
      const { data: movement } = await supabase
        .from("inventory_movements")
        .select("total_amount")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("inventory_movements")
        .update({ 
          is_paid: true,
          amount_paid: movement?.total_amount || 0
        })
        .eq("id", id);
      
      if (error) throw error;

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("audit_logs" as any)
        .insert({
          action: 'PAYMENT_REGISTERED',
          entity_type: 'inventory_movements',
          entity_id: id,
          user_id: user?.id,
          details: { movement_id: id }
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["debtors-summary"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      toast.success("Pago registrado exitosamente");
    },
    onError: () => {
      toast.error("Error al registrar el pago");
    },
  });
}

export function useRegisterPartialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      // Get current movement using raw query
      const { data: movements } = await supabase
        .from("inventory_movements")
        .select("*")
        .eq("id", id);

      const movement = movements?.[0] as any;
      if (!movement) throw new Error("Movimiento no encontrado");

      const currentPaid = Number(movement.amount_paid || 0);
      const newAmountPaid = currentPaid + amount;
      const isPaid = newAmountPaid >= Number(movement.total_amount);

      const { error } = await supabase
        .from("inventory_movements")
        .update({ 
          amount_paid: newAmountPaid,
          is_paid: isPaid
        } as any)
        .eq("id", id);
      
      if (error) throw error;

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("audit_logs" as any)
        .insert({
          action: 'PARTIAL_PAYMENT_REGISTERED',
          entity_type: 'inventory_movements',
          entity_id: id,
          user_id: user?.id,
          details: { movement_id: id, amount }
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["debtors-summary"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      toast.success("Abono registrado exitosamente");
    },
    onError: () => {
      toast.error("Error al registrar el abono");
    },
  });
}
