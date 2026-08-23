/**
 * Print coming_to_see metadata on recent Stripe Checkout Sessions.
 * Does not charge anything.
 *
 * Usage: node scripts/inspect-checkout-metadata.mjs [limit]
 */
import fs from "node:fs";
import Stripe from "stripe";

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

const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
if (!stripeSecret) {
  console.error("Missing STRIPE_SECRET_KEY in .env.local");
  process.exit(2);
}

const limit = Math.min(25, Math.max(1, Number(process.argv[2]) || 10));
const stripe = new Stripe(stripeSecret);
const sessions = await stripe.checkout.sessions.list({ limit });

if (sessions.data.length === 0) {
  console.log("No Checkout Sessions found.");
  process.exit(0);
}

for (const session of sessions.data) {
  const meta = session.metadata ?? {};
  console.log(
    [
      session.created ? new Date(session.created * 1000).toISOString() : "?",
      session.id,
      session.status,
      session.payment_status,
      `coming_to_see=${meta.coming_to_see || "(none)"}`,
      `coming_to_see_id=${meta.coming_to_see_id || "(none)"}`,
    ].join("  ")
  );
}
