
-- Add credit_group_id to link multiple movements in the same credit transaction
ALTER TABLE public.inventory_movements
ADD COLUMN credit_group_id UUID DEFAULT NULL;

-- Index for fast grouping queries
CREATE INDEX idx_movements_credit_group ON public.inventory_movements (credit_group_id) WHERE credit_group_id IS NOT NULL;
