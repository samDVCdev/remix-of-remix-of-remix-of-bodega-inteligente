export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_usd: number;
  stock: number;
  unit: string;
  low_stock_threshold: number;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
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
  package_type: 'individual' | 'paquete' | 'caja' | 'bulto';
  units_per_package: number;
  created_at: string;
  product?: Product;
}

export interface MultiSaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface DashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  todayIncome: number;
  todayExpenses: number;
  lowStockProducts: Product[];
  topSellingProducts: { product: Product; totalSold: number }[];
  recentProducts: Product[];
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

export const PACKAGE_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'caja', label: 'Caja' },
  { value: 'bulto', label: 'Bulto' },
] as const;

export const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
] as const;
