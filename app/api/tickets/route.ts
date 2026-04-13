import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  // 1. Fetch the active event + its tiers from Supabase
  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, name, date, ticket_tiers(id, tier_key, label, description, stripe_price_id, capacity, sold, max_per_order)")
    .eq("is_active", true)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "No active event found" }, { status: 404 });
  }

  // 2. Batch-fetch prices from Stripe
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
  const priceMap = Object.fromEntries(
    stripePrices.map((p) => [p.id, p.unit_amount ?? 0])
  );

  // 3. Merge and return
  const mergedTiers = tiers.map((tier) => ({
    id: tier.tier_key,
    tierId: tier.id,
    label: tier.label,
    description: tier.description,
    priceId: tier.stripe_price_id,
    price: (priceMap[tier.stripe_price_id] ?? 0) / 100, // cents → dollars
    remaining: tier.capacity - tier.sold,
    max: tier.max_per_order,
  }));

  // Sort by price ascending (Early Bird → General → VIP)
  mergedTiers.sort((a, b) => a.price - b.price);

  return NextResponse.json(
    {
      event: {
        name: event.name,
        date: new Date(event.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
      tiers: mergedTiers,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
