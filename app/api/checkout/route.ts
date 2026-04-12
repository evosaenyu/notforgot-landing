import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

  try {
    const session = await stripe.checkout.sessions.create({
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
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
