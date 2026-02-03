-- =====================================================
-- SISTEMA DE INVENTARIO MULTINIVEL Y MULTIMEDIDA
-- =====================================================

-- 1. Añadir campo unidad_minima_base a productos
-- Representa la unidad más pequeña (ej: 'gramo', 'unidad')
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_unit TEXT NOT NULL DEFAULT 'unidad';

-- 2. Añadir campo stock_base_units para inventario en unidades base
-- Este será el inventario real, siempre en la unidad mínima
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_base_units NUMERIC NOT NULL DEFAULT 0;

-- Migrar stock actual a stock_base_units (asumiendo que el stock actual es en unidades base)
UPDATE public.products SET stock_base_units = stock WHERE stock_base_units = 0;

-- 3. Crear tabla de equivalencias para jerarquías de presentaciones
CREATE TABLE IF NOT EXISTS public.unit_equivalences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL, -- ej: 'Caja', 'Cartón', 'Unidad', 'Kilo'
    base_unit_multiplier NUMERIC NOT NULL, -- cuántas unidades base equivale (ej: Caja=360, Kilo=1000)
    display_order INTEGER NOT NULL DEFAULT 0, -- orden de mayor a menor para desglose
    price NUMERIC NOT NULL DEFAULT 0, -- precio de venta para esta presentación
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índice para búsqueda por producto
CREATE INDEX IF NOT EXISTS idx_unit_equivalences_product_id ON public.unit_equivalences(product_id);
CREATE INDEX IF NOT EXISTS idx_unit_equivalences_order ON public.unit_equivalences(product_id, display_order DESC);

-- 4. Habilitar RLS en la tabla de equivalencias
ALTER TABLE public.unit_equivalences ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para equivalencias
CREATE POLICY "Authenticated users can read equivalences" 
ON public.unit_equivalences FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert equivalences" 
ON public.unit_equivalences FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update equivalences" 
ON public.unit_equivalences FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Only admins can delete equivalences" 
ON public.unit_equivalences FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));

-- 5. Añadir is_active a profiles para activar/desactivar usuarios
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 6. Función para obtener stock legible (desglose humano)
CREATE OR REPLACE FUNCTION public.get_readable_stock(
    _product_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _stock NUMERIC;
    _base_unit TEXT;
    _result TEXT := '';
    _remaining NUMERIC;
    _equiv RECORD;
    _count INTEGER;
BEGIN
    -- Obtener stock actual y unidad base del producto
    SELECT stock_base_units, base_unit INTO _stock, _base_unit
    FROM public.products
    WHERE id = _product_id;
    
    IF _stock IS NULL THEN
        RETURN 'Producto no encontrado';
    END IF;
    
    _remaining := _stock;
    
    -- Recorrer equivalencias de mayor a menor
    FOR _equiv IN 
        SELECT unit_name, base_unit_multiplier
        FROM public.unit_equivalences
        WHERE product_id = _product_id
        ORDER BY base_unit_multiplier DESC
    LOOP
        IF _remaining >= _equiv.base_unit_multiplier THEN
            _count := FLOOR(_remaining / _equiv.base_unit_multiplier);
            _remaining := _remaining - (_count * _equiv.base_unit_multiplier);
            
            IF _result != '' THEN
                _result := _result || ', ';
            END IF;
            
            _result := _result || _count || ' ' || _equiv.unit_name;
            IF _count > 1 THEN
                _result := _result || 's';
            END IF;
        END IF;
    END LOOP;
    
    -- Añadir unidades base restantes si hay
    IF _remaining > 0 THEN
        IF _result != '' THEN
            _result := _result || ' y ';
        END IF;
        _result := _result || ROUND(_remaining, 2) || ' ' || _base_unit;
        IF _remaining > 1 THEN
            _result := _result || 's';
        END IF;
    END IF;
    
    -- Si no hay stock
    IF _result = '' THEN
        RETURN 'Sin stock';
    END IF;
    
    RETURN 'Quedan ' || _result;
END;
$$;

-- 7. Función para calcular unidades base a descontar
CREATE OR REPLACE FUNCTION public.calculate_base_units(
    _product_id UUID,
    _quantity NUMERIC,
    _unit_equivalence_id UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _multiplier NUMERIC := 1;
    _product_base_unit TEXT;
BEGIN
    -- Obtener la unidad base del producto
    SELECT base_unit INTO _product_base_unit
    FROM public.products
    WHERE id = _product_id;
    
    -- Si se proporciona una equivalencia, obtener su multiplicador
    IF _unit_equivalence_id IS NOT NULL THEN
        SELECT base_unit_multiplier INTO _multiplier
        FROM public.unit_equivalences
        WHERE id = _unit_equivalence_id;
        
        IF _multiplier IS NULL THEN
            _multiplier := 1;
        END IF;
    -- Si es producto de peso y viene en kilos, convertir a gramos
    ELSIF _product_base_unit = 'gramo' THEN
        _multiplier := 1000; -- Asumiendo que la cantidad viene en kilos
    END IF;
    
    RETURN _quantity * _multiplier;
END;
$$;

-- 8. Modificar trigger de actualización de stock para usar stock_base_units
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.movement_type = 'entrada' THEN
            UPDATE public.products 
            SET stock_base_units = stock_base_units + NEW.quantity,
                stock = stock + NEW.quantity
            WHERE id = NEW.product_id;
        ELSIF NEW.movement_type = 'salida' THEN
            UPDATE public.products 
            SET stock_base_units = stock_base_units - NEW.quantity,
                stock = stock - NEW.quantity
            WHERE id = NEW.product_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.movement_type = 'entrada' THEN
            UPDATE public.products 
            SET stock_base_units = stock_base_units - OLD.quantity,
                stock = stock - OLD.quantity
            WHERE id = OLD.product_id;
        ELSIF OLD.movement_type = 'salida' THEN
            UPDATE public.products 
            SET stock_base_units = stock_base_units + OLD.quantity,
                stock = stock + OLD.quantity
            WHERE id = OLD.product_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 9. Añadir campo unit_equivalence_id a movements para saber qué presentación se vendió
ALTER TABLE public.inventory_movements
ADD COLUMN IF NOT EXISTS unit_equivalence_id UUID REFERENCES public.unit_equivalences(id) ON DELETE SET NULL;

-- 10. Eliminar categorías (primero quitar FK de products)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products DROP COLUMN IF EXISTS category_id;

-- Eliminar la tabla categories
DROP TABLE IF EXISTS public.categories CASCADE;