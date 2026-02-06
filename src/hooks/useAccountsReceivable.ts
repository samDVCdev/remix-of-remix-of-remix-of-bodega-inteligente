import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AccountReceivable {
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
  credit_group_id?: string | null;
}

export interface GroupedAccount {
  groupId: string;
  customerName: string;
  movementDate: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  items: AccountReceivable[];
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

export function useGroupedAccountsReceivable() {
  return useQuery({
    queryKey: ["accounts-receivable-grouped"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select("*");
      
      if (error) throw error;
      
      const accounts = data as unknown as (AccountReceivable & { credit_group_id?: string })[];
      
      // Group accounts by credit_group_id
      const groupMap = new Map<string, GroupedAccount>();
      
      accounts.forEach((account) => {
        // Use credit_group_id if available, otherwise group by customer_name + movement_date
        const groupKey = account.credit_group_id 
          || `${account.customer_name || 'unknown'}_${account.movement_date}`;
        
        const existing = groupMap.get(groupKey);
        if (existing) {
          existing.totalAmount += Number(account.total_amount);
          existing.amountPaid += Number(account.amount_paid || 0);
          existing.amountDue += Number(account.amount_due || account.total_amount);
          existing.items.push(account);
        } else {
          groupMap.set(groupKey, {
            groupId: groupKey,
            customerName: account.customer_name || "Sin nombre",
            movementDate: account.movement_date,
            totalAmount: Number(account.total_amount),
            amountPaid: Number(account.amount_paid || 0),
            amountDue: Number(account.amount_due || account.total_amount),
            items: [account],
          });
        }
      });
      
      return Array.from(groupMap.values()).sort(
        (a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
      );
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

export function useRegisterGroupPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      accountIds, 
      totalAmount, 
      notes 
    }: { 
      accountIds: string[]; 
      totalAmount: number; 
      notes?: string;
    }) => {
      let remainingPayment = totalAmount;
      let allPaid = true;

      // Distribute payment across accounts proportionally or sequentially
      for (const id of accountIds) {
        if (remainingPayment <= 0) break;

        const { data: movements, error: fetchError } = await supabase
          .from("inventory_movements")
          .select("*")
          .eq("id", id);

        if (fetchError) throw fetchError;
        
        const movement = movements?.[0] as any;
        if (!movement) continue;

        const currentPaid = Number(movement.amount_paid || 0);
        const movementTotal = Number(movement.total_amount);
        const movementDue = movementTotal - currentPaid;

        const paymentForThis = Math.min(remainingPayment, movementDue);
        const newAmountPaid = currentPaid + paymentForThis;
        const isPaid = newAmountPaid >= movementTotal - 0.005;

        if (!isPaid) allPaid = false;

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

        await supabase
          .from("inventory_movements")
          .update(updateData as any)
          .eq("id", id);

        remainingPayment -= paymentForThis;
      }

      // Log audit event
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from("audit_logs" as any)
          .insert({
            action: allPaid && remainingPayment >= 0 ? 'GROUP_PAYMENT_COMPLETED' : 'GROUP_PARTIAL_PAYMENT',
            entity_type: 'inventory_movements',
            entity_id: accountIds[0],
            user_id: user?.id,
            details: { 
              account_ids: accountIds, 
              total_payment: totalAmount,
              fully_paid: allPaid 
            }
          });
      } catch (e) {
        console.error("Audit log error:", e);
      }

      return { allPaid };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["debtors-summary"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      toast.success(result.allPaid ? "Deuda saldada completamente" : "Abono registrado exitosamente");
    },
    onError: (error) => {
      console.error("Payment error:", error);
      toast.error("Error al registrar el abono");
    },
  });
}
