-- Drop the security definer view and recreate with security invoker
DROP VIEW IF EXISTS public.accounts_receivable;

CREATE VIEW public.accounts_receivable
WITH (security_invoker = on) AS
SELECT 
  im.*,
  p.name as product_name,
  p.code as product_code,
  pr.full_name as seller_name
FROM public.inventory_movements im
LEFT JOIN public.products p ON im.product_id = p.id
LEFT JOIN public.profiles pr ON im.sold_by = pr.user_id
WHERE im.movement_type = 'salida' 
  AND im.is_credit = true 
  AND im.is_paid = false;

-- Update products RLS policies to allow authenticated access
DROP POLICY IF EXISTS "Acceso público a productos" ON public.products;
CREATE POLICY "Authenticated users can read products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON public.products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Only admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update categories RLS policies
DROP POLICY IF EXISTS "Categories are publicly deletable" ON public.categories;
DROP POLICY IF EXISTS "Categories are publicly insertable" ON public.categories;
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
DROP POLICY IF EXISTS "Categories are publicly updatable" ON public.categories;

CREATE POLICY "Authenticated users can read categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Only admins can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update inventory_movements RLS policies
DROP POLICY IF EXISTS "Acceso público a movimientos" ON public.inventory_movements;

CREATE POLICY "Authenticated users can read movements"
ON public.inventory_movements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert movements"
ON public.inventory_movements FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only admins can update movements"
ON public.inventory_movements FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete movements"
ON public.inventory_movements FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));