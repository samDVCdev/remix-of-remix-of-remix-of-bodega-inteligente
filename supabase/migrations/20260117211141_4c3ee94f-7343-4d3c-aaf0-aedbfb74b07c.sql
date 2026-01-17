-- Tabla de productos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_usd DECIMAL(10, 2) NOT NULL CHECK (price_usd >= 0),
  stock DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit VARCHAR(50) NOT NULL DEFAULT 'unidades',
  low_stock_threshold DECIMAL(10, 3) NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de movimientos de inventario
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida')),
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_products_code ON public.products(code);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX idx_movements_date ON public.inventory_movements(movement_date);
CREATE INDEX idx_movements_type ON public.inventory_movements(movement_type);

-- Habilitar RLS pero permitir acceso público (sistema interno de bodega)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público para sistema interno
CREATE POLICY "Acceso público a productos" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público a movimientos" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para productos
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.movement_type = 'entrada' THEN
      UPDATE public.products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'salida' THEN
      UPDATE public.products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.movement_type = 'entrada' THEN
      UPDATE public.products SET stock = stock - OLD.quantity WHERE id = OLD.product_id;
    ELSIF OLD.movement_type = 'salida' THEN
      UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock
CREATE TRIGGER update_stock_on_movement
  AFTER INSERT OR DELETE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock();