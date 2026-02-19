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
  is_paid?: boolean;
  notes?: string | null;
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
  isPaid: boolean;
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
      // Query inventory_movements directly to include paid records
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*, product:products(name, code)")
        .eq("is_credit", true)
        .order("movement_date", { ascending: false });
      
      if (error) throw error;
      
      // Map to AccountReceivable shape
      const accounts: (AccountReceivable & { credit_group_id?: string })[] = (data || []).map((m: any) => ({
        id: m.id,
        product_id: m.product_id,
        movement_date: m.movement_date,
        quantity: m.quantity,
        unit_price: m.unit_price,
        total_amount: m.total_amount,
        amount_paid: m.amount_paid || 0,
        amount_due: m.total_amount - (m.amount_paid || 0),
        debt_percentage: m.total_amount > 0 ? ((m.total_amount - (m.amount_paid || 0)) / m.total_amount) * 100 : 0,
        customer_name: m.customer_name,
        product_name: m.product?.name || null,
        product_code: m.product?.code || null,
        seller_name: null,
        is_paid: m.is_paid,
        credit_group_id: m.credit_group_id,
        notes: m.notes,
      }));
      
      // Group accounts by credit_group_id or customer_name+date
      const groupMap = new Map<string, GroupedAccount>();
      
      accounts.forEach((account) => {
        const groupKey = account.credit_group_id 
          || `${account.customer_name || 'unknown'}_${account.movement_date}`;
        
        const existing = groupMap.get(groupKey);
        if (existing) {
          existing.totalAmount += Number(account.total_amount);
          existing.amountPaid += Number(account.amount_paid || 0);
          existing.amountDue += Number(account.amount_due || account.total_amount);
          existing.items.push(account);
          // Mark as paid only if ALL items are paid
          if (account.amount_due > 0.005) existing.isPaid = false;
        } else {
          groupMap.set(groupKey, {
            groupId: groupKey,
            customerName: account.customer_name || "Sin nombre",
            movementDate: account.movement_date,
            totalAmount: Number(account.total_amount),
            amountPaid: Number(account.amount_paid || 0),
            amountDue: Number(account.amount_due || account.total_amount),
            items: [account],
            isPaid: account.amount_due <= 0.005,
          });
        }
      });
      
      // Sort: unpaid first, then by date
      return Array.from(groupMap.values()).sort((a, b) => {
        if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
        return new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime();
      });
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

        // Obtener nombre del cliente del primer movimiento
        const { data: firstMovement } = await supabase
          .from("inventory_movements")
          .select("customer_name")
          .eq("id", accountIds[0])
          .single();
        const customerName = firstMovement?.customer_name || "Cliente desconocido";

        await supabase
          .from("audit_logs" as any)
          .insert({
            action: allPaid && remainingPayment >= 0 ? 'GROUP_PAYMENT_COMPLETED' : 'GROUP_PARTIAL_PAYMENT',
            entity_type: 'inventory_movements',
            entity_id: accountIds[0],
            user_id: user?.id,
            details: { 
              customer_name: customerName,
              monto_pagado: totalAmount,
              cuentas_afectadas: accountIds.length,
              saldado_completamente: allPaid 
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
