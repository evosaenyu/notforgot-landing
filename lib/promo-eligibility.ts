import { supabaseAdmin } from "@/lib/supabase";

function promoEligibleTierKeys(): Set<string> {
  return new Set(
    (process.env.PROMO_ELIGIBLE_TIER_KEYS ?? "general,general_admission")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Stripe price ids for tiers that the modal GA promo applies to. */
export async function getPromoEligiblePriceIds(): Promise<Set<string>> {
  const eligibleKeys = promoEligibleTierKeys();
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("ticket_tiers(tier_key, stripe_price_id)")
    .eq("is_active", true)
    .single();

  const tiers = (event?.ticket_tiers ?? []) as {
    tier_key: string;
    stripe_price_id: string;
  }[];

  return new Set(
    tiers
      .filter((t) => eligibleKeys.has(t.tier_key.toLowerCase()))
      .map((t) => t.stripe_price_id)
      .filter(Boolean)
  );
}

export function cartIsPromoEligibleOnly(
  lineItems: { priceId: string }[],
  eligiblePriceIds: Set<string>
): boolean {
  if (!lineItems.length || eligiblePriceIds.size === 0) return false;
  return lineItems.every((item) => eligiblePriceIds.has(item.priceId));
}
