
CREATE TABLE public.currency_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_mode text NOT NULL DEFAULT 'bcv',
  manual_rate numeric NOT NULL DEFAULT 36.5,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read currency settings"
ON public.currency_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update currency settings"
ON public.currency_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert currency settings"
ON public.currency_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row
INSERT INTO public.currency_settings (rate_mode, manual_rate) VALUES ('bcv', 36.5);
