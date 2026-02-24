CREATE TRIGGER update_product_stock_trigger
AFTER INSERT OR DELETE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock();