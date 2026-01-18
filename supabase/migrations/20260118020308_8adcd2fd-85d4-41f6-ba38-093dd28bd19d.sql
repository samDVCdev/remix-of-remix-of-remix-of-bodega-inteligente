-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to products table
ALTER TABLE public.products 
ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Add package_type column for bulk entries (individual, package, box)
ALTER TABLE public.inventory_movements
ADD COLUMN package_type TEXT DEFAULT 'individual',
ADD COLUMN units_per_package INTEGER DEFAULT 1;

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies for categories
CREATE POLICY "Categories are publicly readable"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Categories are publicly insertable"
ON public.categories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Categories are publicly updatable"
ON public.categories FOR UPDATE
USING (true);

CREATE POLICY "Categories are publicly deletable"
ON public.categories FOR DELETE
USING (true);

-- Create trigger for updating timestamps on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();