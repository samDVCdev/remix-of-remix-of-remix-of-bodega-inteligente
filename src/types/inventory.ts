export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_usd: number;
  stock: number;
  unit: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'entrada' | 'salida';
  quantity: number;
  unit_price: number;
  total_amount: number;
  movement_date: string;
  notes: string | null;
  created_at: string;
  product?: Product;
}

export interface DashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  todayIncome: number;
  todayExpenses: number;
  lowStockProducts: Product[];
  topSellingProducts: { product: Product; totalSold: number }[];
}

export const UNITS = [
  { value: 'unidades', label: 'Unidades' },
  { value: 'litros', label: 'Litros' },
  { value: 'mililitros', label: 'Mililitros' },
  { value: 'kilos', label: 'Kilos' },
  { value: 'gramos', label: 'Gramos' },
  { value: 'metros', label: 'Metros' },
  { value: 'cajas', label: 'Cajas' },
  { value: 'paquetes', label: 'Paquetes' },
  { value: 'docenas', label: 'Docenas' },
] as const;
