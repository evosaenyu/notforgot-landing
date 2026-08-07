import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { DELUXE_PROMO_COOKIE, verifyDeluxePromoCookie } from "@/lib/promo-cookie";
import { cartIsPromoEligibleOnly, getPromoEligiblePriceIds } from "@/lib/promo-eligibility";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

type LineItem = {
  priceId: string;
  quantity: number;
};

export async function POST(req: NextRequest) {
  let lineItems: LineItem[];

  try {
    const body = await req.json();
    lineItems = body.lineItems;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!lineItems?.length) {
    return NextResponse.json({ error: "No items in cart" }, { status: 400 });
  }

  for (const item of lineItems) {
    if (!item.priceId || typeof item.quantity !== "number" || item.quantity < 1) {
      return NextResponse.json({ error: "Invalid line item" }, { status: 400 });
    }
  }

  const { data: activeEvent, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, ticket_tiers(id, stripe_price_id)")
    .eq("is_active", true)
    .maybeSingle();

  if (eventError) {
    console.error("[checkout] active event lookup:", eventError);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }

  if (!activeEvent) {
    return NextResponse.json({ error: "No active event" }, { status: 400 });
  }

  const tiers = (activeEvent.ticket_tiers ?? []) as {
    id: string;
    stripe_price_id: string | null;
  }[];
  const tierIdByPrice = new Map(
    tiers
      .filter((t) => t.stripe_price_id)
      .map((t) => [t.stripe_price_id as string, t.id])
  );

  const resolvedTier: string[] = [];
  for (const item of lineItems) {
    const tierId = tierIdByPrice.get(item.priceId);
    if (!tierId) {
      return NextResponse.json(
        { error: "One or more tickets are not available for this event" },
        { status: 400 }
      );
    }
    resolvedTier.push(tierId);
  }

  /** Stripe Coupon id OR Promotion Code API id (`promo_…`) — see STRIPE_PROMO_COUPON_ID. */
  const stripePromoRef = process.env.STRIPE_PROMO_COUPON_ID?.trim();
  const promoCookie = req.cookies.get(DELUXE_PROMO_COOKIE)?.value;
  const hasPromoCookie = Boolean(stripePromoRef && verifyDeluxePromoCookie(promoCookie));
  const eligiblePriceIds = hasPromoCookie ? await getPromoEligiblePriceIds() : new Set<string>();
  const autoApplyPromo =
    hasPromoCookie && cartIsPromoEligibleOnly(lineItems, eligiblePriceIds);

  const priceIds = Array.from(new Set(lineItems.map((item) => item.priceId)));
  const stripePrices = await Promise.all(
    priceIds.map((id) => stripe.prices.retrieve(id))
  );
  const hasCustomUnitAmount = stripePrices.some((p) => p.custom_unit_amount != null);

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      phone_number_collection: { enabled: true },
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/#tickets`,
      metadata: {
        event_id: activeEvent.id,
        tier_ids: resolvedTier.join(","),
      },
    };

    // Stripe: `discounts` and `allow_promotion_codes` are mutually exclusive.
    // Pay-what-you-want prices (`custom_unit_amount`) cannot use promotion codes at all.
    if (!hasCustomUnitAmount) {
      if (autoApplyPromo && stripePromoRef) {
        sessionParams.discounts = stripePromoRef.startsWith("promo_")
          ? [{ promotion_code: stripePromoRef }]
          : [{ coupon: stripePromoRef }];
      } else {
        sessionParams.allow_promotion_codes = true;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
