export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export type SaleType = 'unit' | 'weight' | 'variants';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  units_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  purchase_price: number;
  sale_price: number;
  stock: number;
  unit: string;
  low_stock_threshold: number;
  category_id: string | null;
  sale_type: SaleType;
  price_per_kilo: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
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
  is_credit: boolean;
  is_paid: boolean;
  amount_paid: number;
  customer_name: string | null;
  sold_by: string | null;
  created_at: string;
  product?: Product;
  seller_name?: string;
}

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  unit_price: number;
  total: number;
  variant?: ProductVariant; // for variants products
  grams?: number; // for weight products
  display_name: string; // product name with variant/grams info
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

export const SALE_TYPES = [
  { value: 'unit', label: 'Por Unidad', icon: 'Package' },
  { value: 'weight', label: 'Por Peso (Gramera)', icon: 'Scale' },
  { value: 'variants', label: 'Múltiples Presentaciones', icon: 'Layers' },
] as const;

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
  '#16a34a', // green (primary)
  '#22c55e', // light green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
] as const;