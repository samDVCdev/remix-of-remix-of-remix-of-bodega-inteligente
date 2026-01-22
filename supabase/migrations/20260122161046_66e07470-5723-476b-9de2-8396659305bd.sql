
-- Table for business status (open/closed)
CREATE TABLE public.business_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    is_open boolean NOT NULL DEFAULT false,
    opened_at timestamp with time zone,
    closed_at timestamp with time zone,
    opened_by uuid REFERENCES auth.users(id),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default status (closed)
INSERT INTO public.business_status (is_open) VALUES (false);

-- Enable RLS
ALTER TABLE public.business_status ENABLE ROW LEVEL SECURITY;

-- Policies for business_status
CREATE POLICY "Anyone authenticated can view business status"
ON public.business_status FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can update business status"
ON public.business_status FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Table for audit logs
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    user_id uuid REFERENCES auth.users(id),
    user_name text,
    details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Add amount_paid column to inventory_movements for partial payments
ALTER TABLE public.inventory_movements 
ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    _action text,
    _entity_type text,
    _entity_id uuid DEFAULT NULL,
    _details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_name text;
    _log_id uuid;
BEGIN
    SELECT full_name INTO _user_name 
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, user_name, details)
    VALUES (_action, _entity_type, _entity_id, auth.uid(), _user_name, _details)
    RETURNING id INTO _log_id;
    
    RETURN _log_id;
END;
$$;

-- Update accounts_receivable view to include amount_paid and percentage
DROP VIEW IF EXISTS public.accounts_receivable;
CREATE VIEW public.accounts_receivable WITH (security_invoker = on) AS
SELECT 
    im.id,
    im.product_id,
    im.movement_type,
    im.quantity,
    im.unit_price,
    im.total_amount,
    im.amount_paid,
    (im.total_amount - im.amount_paid) as amount_due,
    CASE 
        WHEN im.total_amount > 0 THEN 
            ROUND(((im.total_amount - im.amount_paid) / im.total_amount * 100)::numeric, 2)
        ELSE 0 
    END as debt_percentage,
    im.movement_date,
    im.notes,
    im.package_type,
    im.units_per_package,
    im.is_credit,
    im.is_paid,
    im.customer_name,
    im.sold_by,
    im.created_at,
    p.name as product_name,
    p.code as product_code,
    pr.full_name as seller_name
FROM public.inventory_movements im
LEFT JOIN public.products p ON im.product_id = p.id
LEFT JOIN public.profiles pr ON im.sold_by = pr.user_id
WHERE im.is_credit = true AND im.is_paid = false;
