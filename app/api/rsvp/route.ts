import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { formatComingToSeeLabels, parseComingToSeeList } from "@/lib/coming-to-see";
import { sendComingToSeePurchaseAlert, sendRsvpConfirmation, sendTicketConfirmation } from "@/lib/email";
import { DOOR_TICKET_PRICE, formatEventDate, isTicketSalesEnabled } from "@/lib/ticket-sales";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email().max(320),
  phone: z.string().min(7, "Phone is required").max(30),
  tierKey: z.string().min(1).optional(),
  plusOne: z.boolean().optional(),
  rsvpKind: z.enum(["free", "door"]).optional(),
  comingToSee: z.union([
    z.array(z.string().min(1)).min(1, "Pick who you're coming to see"),
    z.string().min(1, "Pick who you're coming to see"),
  ]),
});

export async function POST(req: NextRequest) {
  if (!isTicketSalesEnabled()) {
    return NextResponse.json({ error: "RSVPs are closed" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    const result = bodySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Enter a valid name, email, phone, and who you're coming to see." },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, name, date, venue, ticket_tiers(id, tier_key, label, capacity, sold, max_per_order)")
    .eq("is_active", true)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "No active event" }, { status: 404 });
  }

  const tiers = event.ticket_tiers as {
    id: string;
    tier_key: string;
    label: string;
    capacity: number;
    sold: number;
    max_per_order: number;
  }[];

  const tier =
    tiers.find((t) => t.tier_key === (body.tierKey ?? "pay-what-you-want")) ??
    tiers[0];

  if (!tier) {
    return NextResponse.json({ error: "Ticket tier not found" }, { status: 404 });
  }

  const plusOneTbd = body.plusOne === true;
  const quantity = plusOneTbd ? 2 : 1;
  const remaining = tier.capacity - tier.sold;

  if (remaining < quantity) {
    return NextResponse.json(
      { error: remaining <= 0 ? "This event is sold out" : "Not enough spots left for a plus one" },
      { status: 409 }
    );
  }

  const comingToSee = parseComingToSeeList(body.comingToSee);
  if (comingToSee.length === 0) {
    return NextResponse.json({ error: "Pick who you're coming to see" }, { status: 400 });
  }

  const customerName = body.name.trim();
  const customerEmail = body.email.trim().toLowerCase();
  const customerPhone = body.phone.trim();
  const comingToSeeLabels = formatComingToSeeLabels(comingToSee);
  const isDoorRsvp = body.rsvpKind !== "free";

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      stripe_session_id: `rsvp_${randomUUID()}`,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_name: customerName,
      coming_to_see: comingToSeeLabels,
      amount_total_cents: 0,
      status: "completed",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[rsvp] insert order error:", orderError);
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
  }

  const { error: itemError } = await supabaseAdmin.from("order_items").insert({
    order_id: order.id,
    tier_id: tier.id,
    quantity,
  });

  if (itemError) {
    console.error("[rsvp] insert order_item error:", itemError);
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
  }

  const { error: soldError } = await supabaseAdmin.rpc("increment_tier_sold", {
    p_tier_id: tier.id,
    p_qty: quantity,
  });

  if (soldError) {
    console.error("[rsvp] increment_tier_sold error:", soldError);
  }

  try {
    await sendComingToSeePurchaseAlert({
      comingToSee: comingToSeeLabels,
      customerName,
      customerEmail,
      ticketCount: quantity,
      totalDollars: 0,
      eventName: event.name,
      source: "rsvp",
      plusOneTbd,
    });
  } catch (e) {
    console.error("[rsvp] coming-to-see alert:", e);
  }

  try {
    if (isDoorRsvp) {
      await sendRsvpConfirmation({
        customerName,
        customerEmail,
        eventName: event.name,
        eventDate: formatEventDate(event.date),
        eventVenue: event.venue ?? "TBD",
        quantity,
        doorPrice: DOOR_TICKET_PRICE,
        plusOneTbd,
      });
    } else {
      await sendTicketConfirmation({
        customerName,
        customerEmail,
        eventName: event.name,
        eventDate: formatEventDate(event.date),
        eventVenue: event.venue ?? "TBD",
        lineItems: [{ name: `${tier.label} (Free RSVP)`, quantity, unitPrice: 0 }],
        totalDollars: 0,
      });
    }
  } catch (e) {
    console.error("[rsvp] confirmation email:", e);
  }

  return NextResponse.json({ ok: true });
}
