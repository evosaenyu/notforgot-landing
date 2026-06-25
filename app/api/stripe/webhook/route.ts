import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTicketConfirmation, type TicketLineItem } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[webhook] signature error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutCompleted(session);
    } catch (err) {
      // Log but return 200 — Stripe should not retry for application errors
      console.error("[webhook] handleCheckoutCompleted error:", err);
    }
  }

  return NextResponse.json({ received: true });
}

// ─── Handler ─────────────────────────────────────────────────────────────────
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Expand line_items with product details in one retrieve call
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  const lineItems = full.line_items?.data ?? [];
  const tierIdsFromMeta = full.metadata?.tier_ids?.split(",").filter(Boolean) ?? [];
  const customerEmail = full.customer_details?.email ?? null;
  const customerName = full.customer_details?.name ?? "Guest";
  const customerPhone = full.customer_details?.phone ?? null;
  const amountTotal = full.amount_total ?? 0;

  // ── 1. Write order to Supabase ───────────────────────────────────────────
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      amount_total_cents: amountTotal,
      status: "completed",
    })
    .select("id")
    .single();

  if (orderError) {
    console.error("[webhook] insert order error:", orderError);
    throw orderError;
  }

  // ── 2. Upsert order_items + decrement sold counts ────────────────────────
  for (let index = 0; index < lineItems.length; index++) {
    const item = lineItems[index];
    const stripePrice = item.price;
    if (!stripePrice) continue;

    let tier: { id: string; sold: number } | null = null;

    const { data: tierByPrice } = await supabaseAdmin
      .from("ticket_tiers")
      .select("id, sold")
      .eq("stripe_price_id", stripePrice.id)
      .maybeSingle();
    tier = tierByPrice;

    if (!tier && tierIdsFromMeta[index]) {
      const { data: tierByMeta } = await supabaseAdmin
        .from("ticket_tiers")
        .select("id, sold")
        .eq("id", tierIdsFromMeta[index])
        .maybeSingle();
      tier = tierByMeta;
    }

    if (!tier) {
      console.warn("[webhook] no tier found for price:", stripePrice.id);
      continue;
    }

    const qty = item.quantity ?? 0;

    await supabaseAdmin
      .from("order_items")
      .insert({ order_id: order.id, tier_id: tier.id, quantity: qty });

    await supabaseAdmin
      .from("ticket_tiers")
      .update({ sold: tier.sold + qty })
      .eq("id", tier.id);
  }

  // ── 3. Send confirmation email ───────────────────────────────────────────
  if (!customerEmail) {
    console.warn("[webhook] no customer email — skipping confirmation send");
    return;
  }

  // Fetch the active event for display info
  const { data: eventRow } = await supabaseAdmin
    .from("events")
    .select("name, date, venue")
    .eq("is_active", true)
    .single();

  const emailLineItems: TicketLineItem[] = lineItems.map((item) => {
    const product = item.price?.product;
    const productName =
      product && typeof product !== "string" ? (product as Stripe.Product).name : "Ticket";
    return {
      name: productName,
      quantity: item.quantity ?? 1,
      unitPrice: Math.round((item.price?.unit_amount ?? 0) / 100),
    };
  });

  await sendTicketConfirmation({
    customerName,
    customerEmail,
    eventName: eventRow?.name ?? "NOTFORGOT",
    eventDate: eventRow
      ? new Date(eventRow.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "",
    eventVenue: eventRow?.venue ?? "TBD",
    lineItems: emailLineItems,
    totalDollars: Math.round(amountTotal / 100),
  });
}
