-- Allow admins to insert into business_status
CREATE POLICY "Only admins can insert business status" 
ON public.business_status 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial business status row
INSERT INTO public.business_status (is_open, opened_at) 
VALUES (false, NULL);