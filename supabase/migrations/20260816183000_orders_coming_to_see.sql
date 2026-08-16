ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coming_to_see text;
