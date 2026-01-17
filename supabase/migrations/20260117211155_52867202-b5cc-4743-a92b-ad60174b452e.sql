-- Corregir las funciones con search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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