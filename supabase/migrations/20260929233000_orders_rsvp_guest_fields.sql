-- Names for the guest list: paid buyers (from Stripe) and website RSVPs.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS coming_to_see text;

COMMENT ON COLUMN public.orders.customer_name IS 'Buyer or RSVP name collected on the site.';
COMMENT ON COLUMN public.orders.coming_to_see IS 'Artist names selected at checkout or RSVP.';
