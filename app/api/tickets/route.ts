import { NextResponse } from "next/server";
import Stripe from "stripe";
import { formatEventDate } from "@/lib/ticket-sales";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, name, date, description, venue, ticket_tiers(id, tier_key, label, description, stripe_price_id, capacity, sold, max_per_order)")
    .eq("is_active", true)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json(
      { event: null, tiers: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const tiers = event.ticket_tiers as {
    id: string;
    tier_key: string;
    label: string;
    description: string;
    stripe_price_id: string;
    capacity: number;
    sold: number;
    max_per_order: number;
  }[];

  const priceIds = tiers.map((t) => t.stripe_price_id).filter(Boolean);
  const stripePrices = await Promise.all(
    priceIds.map((id) => stripe.prices.retrieve(id))
  );
  const priceById = Object.fromEntries(stripePrices.map((p) => [p.id, p]));

  const mergedTiers = tiers.map((tier) => {
    const stripePrice = priceById[tier.stripe_price_id];
    const customAmount = stripePrice?.custom_unit_amount;
    const isPayWhatYouWant = customAmount != null;
    const unitAmount =
      stripePrice?.unit_amount ??
      customAmount?.preset ??
      customAmount?.minimum ??
      0;

    return {
      id: tier.tier_key,
      tierId: tier.id,
      label: tier.label,
      description: tier.description,
      priceId: tier.stripe_price_id,
      price: unitAmount / 100,
      isPayWhatYouWant,
      payWhatYouWantMinimum: (customAmount?.minimum ?? 0) / 100,
      remaining: tier.capacity - tier.sold,
      max: tier.max_per_order,
    };
  });

  mergedTiers.sort((a, b) => {
    if (a.isPayWhatYouWant !== b.isPayWhatYouWant) {
      return a.isPayWhatYouWant ? 1 : -1;
    }
    return a.price - b.price;
  });

  return NextResponse.json(
    {
      event: {
        name: event.name,
        date: formatEventDate(event.date),
        description: event.description,
        venue: event.venue,
      },
      tiers: mergedTiers,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
