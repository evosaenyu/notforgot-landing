import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { DELUXE_PROMO_COOKIE, verifyDeluxePromoCookie } from "@/lib/promo-cookie";
import { cartIsPromoEligibleOnly, getPromoEligiblePriceIds } from "@/lib/promo-eligibility";

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

  // Validate quantities
  for (const item of lineItems) {
    if (!item.priceId || typeof item.quantity !== "number" || item.quantity < 1) {
      return NextResponse.json({ error: "Invalid line item" }, { status: 400 });
    }
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
      // Collect phone number so we can store it in orders after webhook
      phone_number_collection: { enabled: true },
      // Let Stripe collect the email at checkout
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/#tickets`,
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
