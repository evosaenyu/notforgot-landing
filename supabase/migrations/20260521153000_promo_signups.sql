-- Promo / marketing captures from notforgot-landing (e.g. Deluxe coupon modal).

CREATE TABLE public.promo_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  full_name text NOT NULL,
  email text NOT NULL,
  signup_source text NOT NULL DEFAULT 'deluxe_ticket_10_off',
  coupon_code_display text,
  CONSTRAINT promo_signups_email_key UNIQUE (email)
);

CREATE INDEX promo_signups_created_at_idx ON public.promo_signups (created_at DESC);
CREATE INDEX promo_signups_signup_source_idx ON public.promo_signups (signup_source);

COMMENT ON TABLE public.promo_signups IS 'Landing page promo captures (name, email); written by backend with service role.';

ALTER TABLE public.promo_signups ENABLE ROW LEVEL SECURITY;
