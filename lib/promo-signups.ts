import { supabaseAdmin } from "@/lib/supabase";

/** Distinct values per campaign / capture surface. */
export const PROMO_MODAL_SOURCE = "promo modal";

export async function upsertPromoSignup(input: {
  fullName: string;
  email: string;
  signupSource?: string;
  couponCodeDisplay?: string | null;
}): Promise<{ skipped: boolean; error: Error | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url?.trim() || !key?.trim()) {
    console.warn("[promo_signups] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY — not persisted");
    return { skipped: true, error: null };
  }

  const emailNorm = input.email.trim().toLowerCase();
  const coupon =
    input.couponCodeDisplay != null && String(input.couponCodeDisplay).trim() !== ""
      ? String(input.couponCodeDisplay).trim()
      : null;

  const { error } = await supabaseAdmin.from("promo_signups").upsert(
    {
      full_name: input.fullName.trim(),
      email: emailNorm,
      signup_source: input.signupSource ?? PROMO_MODAL_SOURCE,
      coupon_code_display: coupon,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    return { skipped: false, error: new Error(error.message) };
  }
  return { skipped: false, error: null };
}
