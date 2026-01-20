import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, DashboardStats } from "@/types/inventory";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split("T")[0];

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*");
      
      if (productsError) throw productsError;

      // Get today's movements
      const { data: todayMovements, error: movementsError } = await supabase
        .from("inventory_movements")
        .select("*")
        .eq("movement_date", today);
      
      if (movementsError) throw movementsError;

      // Get all sales for top products
      const { data: allSales, error: salesError } = await supabase
        .from("inventory_movements")
        .select("product_id, quantity")
        .eq("movement_type", "salida");
      
      if (salesError) throw salesError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      
      const totalInventoryValue = products?.reduce(
        (sum, p) => sum + (Number(p.sale_price) * Number(p.stock)), 
        0
      ) || 0;

      const todayIncome = todayMovements
        ?.filter((m) => m.movement_type === "salida")
        .reduce((sum, m) => sum + Number(m.total_amount), 0) || 0;

      const todayExpenses = todayMovements
        ?.filter((m) => m.movement_type === "entrada")
        .reduce((sum, m) => sum + Number(m.total_amount), 0) || 0;

      const lowStockProducts = products?.filter(
        (p) => Number(p.stock) <= Number(p.low_stock_threshold)
      ) || [];

      // Calculate top selling products
      const salesByProduct: Record<string, number> = {};
      allSales?.forEach((sale) => {
        salesByProduct[sale.product_id] = (salesByProduct[sale.product_id] || 0) + Number(sale.quantity);
      });

      const topSellingProducts = Object.entries(salesByProduct)
        .map(([productId, totalSold]) => ({
          product: products?.find((p) => p.id === productId) as Product,
          totalSold,
        }))
        .filter((item) => item.product)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      // Recent products (last 10 by created_at)
      const recentProducts = (products || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      return {
        totalProducts,
        totalInventoryValue,
        todayIncome,
        todayExpenses,
        lowStockProducts: lowStockProducts as Product[],
        topSellingProducts,
        recentProducts: recentProducts as Product[],
      };
    },
  });
}
