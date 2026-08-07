/**
 * End-to-end webhook inventory test (no charge).
 * Creates an unpaid Checkout Session, POSTs a signed
 * checkout.session.completed event to the local app, verifies
 * Early Bird sold++, then cleans up the test order / sold bump.
 *
 * Usage: node scripts/test-webhook-sold.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */
import fs from "node:fs";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const paths = ["./.env.local", "./.env"];
for (const p of paths) {
  try {
    const raw = fs.readFileSync(p, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const i = trimmed.indexOf("=");
      if (i === -1) return;
      const k = trimmed.slice(0, i).trim();
      let v = trimmed.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    });
    break;
  } catch {
    /* try next */
  }
}

const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SECRET_KEY?.trim();

if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseKey) {
  console.error("Missing Stripe/Supabase env in .env.local");
  process.exit(2);
}

const stripe = new Stripe(stripeSecret);
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const { data: event, error: eventError } = await supabase
  .from("events")
  .select("id, name, ticket_tiers(id, tier_key, label, stripe_price_id, sold, capacity)")
  .eq("is_active", true)
  .maybeSingle();

assert(!eventError, `Event lookup failed: ${eventError?.message}`);
assert(event, "No active event");

const early = (event.ticket_tiers || []).find((t) => t.tier_key === "early-bird");
assert(early?.stripe_price_id, "Active Early Bird tier missing stripe_price_id");

const soldBefore = early.sold;
console.log(`Active event: ${event.name}`);
console.log(`Early Bird before: sold=${soldBefore}, remaining=${early.capacity - soldBefore}`);

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{ price: early.stripe_price_id, quantity: 1 }],
  success_url: "https://example.com/success",
  cancel_url: "https://example.com/cancel",
  metadata: {
    event_id: event.id,
    tier_ids: early.id,
    webhook_test: "sold-decrement",
  },
});

console.log(`Created unpaid test session: ${session.id}`);

const eventPayload = {
  id: `evt_test_sold_${Date.now()}`,
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: session.id,
      object: "checkout.session",
      metadata: session.metadata,
      payment_intent: null,
      customer_details: null,
      amount_total: session.amount_total,
    },
  },
};

const payload = JSON.stringify(eventPayload);
const header = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: webhookSecret,
});

const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stripe-signature": header,
  },
  body: payload,
});

const bodyText = await res.text();
console.log(`Webhook response: ${res.status} ${bodyText}`);

const { data: earlyAfter, error: afterError } = await supabase
  .from("ticket_tiers")
  .select("sold, capacity")
  .eq("id", early.id)
  .single();

assert(!afterError, `Re-read tier failed: ${afterError?.message}`);

const { data: order } = await supabase
  .from("orders")
  .select("id, order_items(id, tier_id, quantity)")
  .eq("stripe_session_id", session.id)
  .maybeSingle();

const ok =
  res.ok &&
  earlyAfter.sold === soldBefore + 1 &&
  order?.order_items?.length === 1 &&
  order.order_items[0].tier_id === early.id &&
  order.order_items[0].quantity === 1;

console.log(`Early Bird after: sold=${earlyAfter.sold}, remaining=${earlyAfter.capacity - earlyAfter.sold}`);
console.log(`Order items: ${JSON.stringify(order?.order_items ?? null)}`);

// Cleanup — always attempt so we don't leave inventory skewed
if (order?.id) {
  await supabase.from("order_items").delete().eq("order_id", order.id);
  await supabase.from("orders").delete().eq("id", order.id);
}
if (earlyAfter.sold === soldBefore + 1) {
  await supabase.from("ticket_tiers").update({ sold: soldBefore }).eq("id", early.id);
}

try {
  await stripe.checkout.sessions.expire(session.id);
} catch {
  /* already expired / completed */
}

const { data: earlyFinal } = await supabase
  .from("ticket_tiers")
  .select("sold")
  .eq("id", early.id)
  .single();

console.log(`Cleanup done. Early Bird sold restored to ${earlyFinal?.sold}`);

if (!ok) {
  console.error("FAIL: webhook did not increment sold / create order_items as expected");
  process.exit(1);
}

console.log("PASS: webhook applied inventory for Early Bird and cleanup restored sold count");
