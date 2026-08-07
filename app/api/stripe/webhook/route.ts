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
      console.error("[webhook] handleCheckoutCompleted error:", err);
      // Non-2xx so Stripe retries — inventory/order writes must not be silently dropped
      return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function resolveActiveEventId(session: Stripe.Checkout.Session): Promise<string | null> {
  const metaEventId = session.metadata?.event_id?.trim();
  if (metaEventId) return metaEventId;

  const { data: eventRow, error } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[webhook] active event lookup error:", error);
    throw error;
  }
  return eventRow?.id ?? null;
}

async function resolveTierForLineItem(opts: {
  stripePriceId: string;
  tierIdFromMeta: string | undefined;
  activeEventId: string | null;
}): Promise<{ id: string } | null> {
  const { stripePriceId, tierIdFromMeta, activeEventId } = opts;

  if (tierIdFromMeta) {
    let q = supabaseAdmin
      .from("ticket_tiers")
      .select("id")
      .eq("id", tierIdFromMeta);
    if (activeEventId) q = q.eq("event_id", activeEventId);
    const { data, error } = await q.maybeSingle();
    if (error) {
      console.error("[webhook] tier-by-meta lookup error:", error);
      throw error;
    }
    if (data) return data;
  }

  // Scope by active event so reused Stripe price IDs on inactive events don't collide.
  let priceQuery = supabaseAdmin
    .from("ticket_tiers")
    .select("id")
    .eq("stripe_price_id", stripePriceId);
  if (activeEventId) {
    priceQuery = priceQuery.eq("event_id", activeEventId);
  }
  const { data: tierByPrice, error: priceError } = await priceQuery.maybeSingle();
  if (priceError) {
    console.error("[webhook] tier-by-price lookup error:", priceError);
    throw priceError;
  }
  return tierByPrice;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  const lineItems = full.line_items?.data ?? [];
  const tierIdsFromMeta = full.metadata?.tier_ids?.split(",").filter(Boolean) ?? [];
  const customerEmail = full.customer_details?.email ?? null;
  const customerName = full.customer_details?.name ?? "Guest";
  const customerPhone = full.customer_details?.phone ?? null;
  const amountTotal = full.amount_total ?? 0;
  const activeEventId = await resolveActiveEventId(full);

  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  let orderId = existingOrder?.id ?? null;

  if (!orderId) {
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
      const { data: raced } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();
      if (!raced) {
        console.error("[webhook] insert order error:", orderError);
        throw orderError;
      }
      orderId = raced.id;
    } else {
      orderId = order.id;
    }
  }

  const { data: existingItems } = await supabaseAdmin
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .limit(1);

  const alreadyFullyProcessed = (existingItems?.length ?? 0) > 0;

  if (!alreadyFullyProcessed) {
    for (let index = 0; index < lineItems.length; index++) {
      const item = lineItems[index];
      const stripePrice = item.price;
      if (!stripePrice) continue;

      const tier = await resolveTierForLineItem({
        stripePriceId: stripePrice.id,
        tierIdFromMeta: tierIdsFromMeta[index],
        activeEventId,
      });

      if (!tier) {
        console.warn("[webhook] no tier found for price:", stripePrice.id, {
          activeEventId,
          tierIdFromMeta: tierIdsFromMeta[index],
        });
        throw new Error(`No ticket tier for Stripe price ${stripePrice.id}`);
      }

      const qty = item.quantity ?? 0;
      if (qty < 1) continue;

      const { error: itemError } = await supabaseAdmin
        .from("order_items")
        .insert({ order_id: orderId, tier_id: tier.id, quantity: qty });

      if (itemError) {
        console.error("[webhook] insert order_item error:", itemError);
        throw itemError;
      }

      const { error: soldError } = await supabaseAdmin.rpc("increment_tier_sold", {
        p_tier_id: tier.id,
        p_qty: qty,
      });

      if (soldError) {
        console.error("[webhook] increment_tier_sold error:", soldError);
        throw soldError;
      }
    }
  }

  if (alreadyFullyProcessed) {
    return;
  }

  if (!customerEmail) {
    console.warn("[webhook] no customer email — skipping confirmation send");
    return;
  }

  const { data: eventRow } = await supabaseAdmin
    .from("events")
    .select("name, date, venue")
    .eq("is_active", true)
    .maybeSingle();

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
