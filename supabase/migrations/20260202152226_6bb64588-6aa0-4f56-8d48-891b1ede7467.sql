-- Add sale_type to products table
ALTER TABLE public.products 
ADD COLUMN sale_type text NOT NULL DEFAULT 'unit' 
CHECK (sale_type IN ('unit', 'weight', 'variants'));

-- Add price_per_kilo for weight-based products
ALTER TABLE public.products 
ADD COLUMN price_per_kilo numeric DEFAULT 0;

-- Create product_variants table for products with multiple presentations
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL,
  units_count integer DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_variants
CREATE POLICY "Authenticated users can read product variants"
ON public.product_variants
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert product variants"
ON public.product_variants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product variants"
ON public.product_variants
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Only admins can delete product variants"
ON public.product_variants
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);