-- Atomic sold counter for webhook concurrency
CREATE OR REPLACE FUNCTION public.increment_tier_sold(p_tier_id uuid, p_qty integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ticket_tiers
  SET sold = sold + p_qty
  WHERE id = p_tier_id
    AND p_qty > 0;
$$;

REVOKE ALL ON FUNCTION public.increment_tier_sold(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_tier_sold(uuid, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tier_sold(uuid, integer) TO service_role;

-- Idempotent webhook inserts
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_uidx
  ON public.orders (stripe_session_id);
