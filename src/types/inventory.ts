export type SaleType = 'unit' | 'weight' | 'variants';

export interface UnitEquivalence {
  id: string;
  product_id: string;
  unit_name: string;
  base_unit_multiplier: number;
  display_order: number;
  price: number;
  created_at: string;
}

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
  stock_base_units: number;
  base_unit: string;
  unit: string;
  low_stock_threshold: number;
  sale_type: SaleType;
  price_per_kilo: number;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
  equivalences?: UnitEquivalence[];
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
  unit_equivalence_id: string | null;
  created_at: string;
  product?: Product;
  seller_name?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total: number;
  variant?: ProductVariant;
  equivalence?: UnitEquivalence;
  grams?: number;
  display_name: string;
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

export const BASE_UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'gramo', label: 'Gramo' },
  { value: 'mililitro', label: 'Mililitro' },
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
