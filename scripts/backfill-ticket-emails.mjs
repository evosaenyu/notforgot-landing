/**
 * Backfill ticket confirmation emails for the active (upcoming) event.
 * ONLY TO BE USED IF EMAILS WERE NOT SENT USING THE NEW RESEND PROVIDER
 *
 * Reads the not-forgot Supabase DB, then sends the purple confirmation
 * (copied from the old SendGrid template in lib/email.ts) with:
 *   - ticket qty / line items
 *   - purchase date(s)
 *   - SHOW NOTES block below (edit SHOW_NOTES_HTML / SHOW_NOTES_TEXT)
 *
 * Default is dry-run. Does not send unless you pass --send.
 *
 *   node scripts/backfill-ticket-emails.mjs
 *   node scripts/backfill-ticket-emails.mjs --limit 3
 *   node scripts/backfill-ticket-emails.mjs --send
 *   node scripts/backfill-ticket-emails.mjs --send --limit 1
 *   node scripts/backfill-ticket-emails.mjs --send --limit 1 --to you@example.com
 *   node scripts/backfill-ticket-emails.mjs --send --limit 1 --to you@example.com --tickets 2
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ─── Edit this before sending ─────────────────────────────────────────────────
/** HTML shown in the purple "Show info" section. Leave empty to hide the section. */
const SHOW_NOTES_HTML = `
`;

/** Plain-text version of the same notes. */
const SHOW_NOTES_TEXT = ``;

const FROM_NAME = "N.F.G. Collective";
const TZ = "America/New_York";
const LINEUP = [
  "Wes",
  "Ramya",
  "Holdout",
  "Vetter",
  "Tevin Williams",
  "LJ The Vagabond",
  "N.F.G. Collective",
  "Lexaverse feat Schrodinger's Cats",
];

// ─── env ──────────────────────────────────────────────────────────────────────
const envPaths = ["./.env.local", "./.env"];
for (const p of envPaths) {
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

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) return undefined;
  return v;
}

const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const toOverride = argValue("--to")?.trim().toLowerCase();
const limitArg = argValue("--limit");
const limit = limitArg ? Number(limitArg) : Infinity;
const ticketsOverride = argValue("--tickets")
  ? Number(argValue("--tickets"))
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SECRET_KEY?.trim();
const resendKey = process.env.RESEND_API_KEY?.trim();
const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(2);
}
if (send && (!resendKey || !fromEmail)) {
  console.error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL (required for --send)");
  process.exit(2);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
const resend = resendKey ? new Resend(resendKey) : null;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(iso) {
  const day = new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  });
  return `${day}, 6:00 PM EDT`;
}

function formatPurchaseDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

function firstNameFrom(fullName, email) {
  const fromSignup = fullName?.trim().split(/\s+/)[0];
  if (fromSignup) return fromSignup;
  const local = email.split("@")[0] ?? "";
  if (local && !/^\d+$/.test(local)) return local;
  return "there";
}

// Copied from lib/email.ts (old SendGrid purple confirmation), then extended
// with ticket count, purchase date, and optional show notes.
function buildBackfillHtml(d) {
  const rows = d.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 16px;color:#e9d5ff;font-size:14px;border-bottom:1px solid #3b1f5e;">${escapeHtml(item.name)}</td>
        <td style="padding:10px 16px;color:#e9d5ff;font-size:14px;text-align:center;border-bottom:1px solid #3b1f5e;">${item.quantity}</td>
        <td style="padding:10px 16px;color:#e9d5ff;font-size:14px;text-align:right;border-bottom:1px solid #3b1f5e;">$${item.unitPrice}</td>
        <td style="padding:10px 16px;color:#ffa5f9;font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid #3b1f5e;">$${item.quantity * item.unitPrice}</td>
      </tr>`
    )
    .join("");

  const ticketWord = d.ticketCount === 1 ? "ticket" : "tickets";
  const lineupRows = LINEUP.map(
    (act, i) => `
                  <tr>
                    <td style="padding:10px 16px;color:#e9d5ff;font-size:15px;border-bottom:${i === LINEUP.length - 1 ? "none" : "1px solid #3b1f5e"};">${escapeHtml(act)}</td>
                  </tr>`
  ).join("");
  const notes = SHOW_NOTES_HTML.trim();
  const notesBlock = notes
    ? `
          <tr>
            <td style="background-color:#160830;padding:8px 32px 8px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
              <p style="margin:24px 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Show info</p>
              <div style="border:1px solid #3b1f5e;border-radius:8px;background:#1e0a38;padding:20px 24px;font-size:14px;color:#e9d5ff;line-height:1.6;">
                ${notes}
              </div>
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your tickets are confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#1a0a2e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a0a2e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#2d0a4e;background:linear-gradient(135deg,#2d0a4e,#4a1080);border-radius:12px 12px 0 0;padding:40px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#ffa5f9;">N.F.G.</p>
              <p style="margin:4px 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#ffa5f9;">Collective</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#d8b4fe;">Sorry for the late confirmation email, we had to switch email providers!</p>
              <p style="margin:0;font-size:32px;font-weight:700;line-height:1.2;letter-spacing:-0.5px;color:#ffffff;">
                <span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff;">You&rsquo;re confirmed.</span>
              </p>
              <p style="margin:12px 0 0;font-size:16px;color:#d8b4fe;">You have ${d.ticketCount} ${ticketWord}. We are so excited to see you!</p>
            </td>
          </tr>

          <!-- Event details -->
          <tr>
            <td style="background-color:#1e0a38;padding:28px 32px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Event</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${escapeHtml(d.eventName)}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:12px;">
                          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Date</p>
                          <p style="margin:0;font-size:15px;color:#e9d5ff;">${escapeHtml(d.eventDate)}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Venue</p>
                          <p style="margin:0;font-size:15px;color:#e9d5ff;">${escapeHtml(d.eventVenue)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Purchased</p>
                    <p style="margin:0;font-size:15px;color:#e9d5ff;">${escapeHtml(d.purchasedAt)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ticket breakdown -->
          <tr>
            <td style="background-color:#160830;padding:0 32px 8px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
              <p style="margin:24px 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Your order</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #3b1f5e;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background-color:#2d0a4e;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d73c8;font-weight:600;">Ticket</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d73c8;font-weight:600;">Qty</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d73c8;font-weight:600;">Each</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d73c8;font-weight:600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
                <tfoot>
                  <tr style="background-color:#1e0a38;">
                    <td colspan="3" style="padding:12px 16px;font-size:13px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Total paid</td>
                    <td style="padding:12px 16px;font-size:18px;font-weight:700;color:#ffa5f9;text-align:right;">$${d.totalDollars}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Lineup -->
          <tr>
            <td style="background-color:#160830;padding:8px 32px 8px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
              <p style="margin:24px 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Lineup</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #3b1f5e;border-radius:8px;overflow:hidden;">
                <tbody>
                  ${lineupRows}
                </tbody>
              </table>
            </td>
          </tr>
${notesBlock}
          <!-- CTA / note -->
          <tr>
            <td style="background-color:#160830;padding:24px 32px 32px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
              <p style="margin:0;font-size:14px;color:#9d73c8;line-height:1.6;">
                Keep this email as your confirmation. Doors details and any updates will be sent to
                <strong style="color:#e9d5ff;">${escapeHtml(d.customerEmail)}</strong>.
                Questions? Reach us on <a href="https://www.instagram.com/nfgxcollective/" style="color:#ffa5f9;text-decoration:none;">@nfgxcollective</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f0520;border-radius:0 0 12px 12px;border:1px solid #3b1f5e;border-top:none;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#4a2d6e;">© ${new Date().getFullYear()} N.F.G. Records LLC. All rights reserved.</p>
              <p style="margin:0;font-size:11px;color:#3b1f5e;">New York City</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildBackfillText(d) {
  const lines = d.lineItems.map(
    (i) => `  ${i.name} x${i.quantity} — $${i.quantity * i.unitPrice}`
  );
  const notes = SHOW_NOTES_TEXT.trim();
  return [
    `N.F.G. COLLECTIVE — Ticket Confirmation`,
    ``,
    `Sorry for the late confirmation email, we had to switch email providers!`,
    ``,
    `You're confirmed for ${d.eventName}.`,
    `You have ${d.ticketCount} ${d.ticketCount === 1 ? "ticket" : "tickets"}.`,
    ``,
    `DATE:      ${d.eventDate}`,
    `VENUE:     ${d.eventVenue}`,
    `PURCHASED: ${d.purchasedAt}`,
    ``,
    `ORDER`,
    ...lines,
    `──────────────────────`,
    `Total paid: $${d.totalDollars}`,
    ``,
    `LINEUP`,
    ...LINEUP.map((act) => `  ${act}`),
    notes ? `` : null,
    notes ? `SHOW INFO` : null,
    notes ? notes : null,
    ``,
    `Keep this email as your confirmation.`,
    `Questions? @nfgxcollective on Instagram.`,
    ``,
    `© ${new Date().getFullYear()} N.F.G. Records LLC`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

const { data: event, error: eventError } = await supabase
  .from("events")
  .select("id, name, date, venue")
  .eq("is_active", true)
  .maybeSingle();

if (eventError) {
  console.error("Event lookup failed:", eventError.message);
  process.exit(1);
}
if (!event) {
  console.error("No active event");
  process.exit(1);
}

const { data: rows, error: orderError } = await supabase
  .from("orders")
  .select(
    `
    id,
    customer_email,
    amount_total_cents,
    status,
    created_at,
    order_items (
      quantity,
      ticket_tiers (
        id,
        event_id,
        label,
        price_cents
      )
    )
  `
  )
  .eq("status", "completed")
  .order("created_at", { ascending: true });

if (orderError) {
  console.error("Order lookup failed:", orderError.message);
  process.exit(1);
}

const { data: signups } = await supabase
  .from("promo_signups")
  .select("email, full_name");

const nameByEmail = new Map(
  (signups ?? []).map((s) => [String(s.email).trim().toLowerCase(), s.full_name])
);

/** @type {Map<string, {
 *   email: string,
 *   purchasedAt: string[],
 *   amountCents: number,
 *   items: Map<string, { name: string, quantity: number, unitPrice: number }>
 * }>} */
const byEmail = new Map();

for (const order of rows ?? []) {
  const email = order.customer_email?.trim().toLowerCase();
  if (!email) continue;

  const itemsForEvent = (order.order_items ?? []).filter(
    (item) => item.ticket_tiers?.event_id === event.id
  );
  if (itemsForEvent.length === 0) continue;

  let bucket = byEmail.get(email);
  if (!bucket) {
    bucket = {
      email,
      purchasedAt: [],
      amountCents: 0,
      items: new Map(),
    };
    byEmail.set(email, bucket);
  }

  bucket.purchasedAt.push(order.created_at);
  bucket.amountCents += order.amount_total_cents ?? 0;

  for (const item of itemsForEvent) {
    const tier = item.ticket_tiers;
    const key = tier?.id ?? tier?.label ?? "ticket";
    const existing = bucket.items.get(key);
    const qty = item.quantity ?? 0;
    const unitPrice = Math.round((tier?.price_cents ?? 0) / 100);
    if (existing) existing.quantity += qty;
    else {
      bucket.items.set(key, {
        name: tier?.label ?? "Ticket",
        quantity: qty,
        unitPrice,
      });
    }
  }
}

function recTicketCount(rec) {
  return [...rec.items.values()].reduce((sum, item) => sum + item.quantity, 0);
}

let recipients = [...byEmail.values()];
if (ticketsOverride && Number.isFinite(ticketsOverride) && ticketsOverride > 0) {
  const match = recipients.find((r) => recTicketCount(r) === ticketsOverride);
  if (match) {
    recipients = [match];
  } else {
    const sample = { ...recipients[0], items: new Map(recipients[0].items) };
    const firstKey = [...sample.items.keys()][0];
    const first = sample.items.get(firstKey);
    if (first) {
      sample.items = new Map(sample.items);
      sample.items.set(firstKey, { ...first, quantity: ticketsOverride });
      sample.amountCents = first.unitPrice * ticketsOverride * 100;
    }
    recipients = [sample];
  }
} else {
  recipients = recipients.slice(0, Number.isFinite(limit) ? limit : undefined);
}

console.log(
  `${send ? "SEND" : "DRY RUN"} — ${event.name} — ${recipients.length} of ${byEmail.size} unique buyers`
);
if (!SHOW_NOTES_HTML.trim()) {
  console.log("Show notes: (empty — fill SHOW_NOTES_HTML at the top of this file)");
}

for (const [i, rec] of recipients.entries()) {
  const lineItems = [...rec.items.values()];
  const ticketCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const purchasedAt = [...new Set(rec.purchasedAt.map(formatPurchaseDate))].join(
    " · "
  );
  const deliverTo = toOverride || rec.email;
  const customerName = toOverride
    ? "Test"
    : firstNameFrom(nameByEmail.get(rec.email), rec.email);
  const payload = {
    customerName,
    customerEmail: deliverTo,
    eventName: event.name,
    eventDate: formatWhen(event.date),
    eventVenue: event.venue ?? "TBD",
    purchasedAt,
    ticketCount,
    lineItems,
    totalDollars: Math.round(rec.amountCents / 100),
  };

  const subject = `🎟 Your ticket confirmation: ${event.name}`;
  const html = buildBackfillHtml(payload);
  const text = buildBackfillText(payload);

  console.log(
    `${String(i + 1).padStart(2, "0")}. ${deliverTo}${toOverride ? ` (sample order)` : ""}  |  ${ticketCount} ticket${ticketCount === 1 ? "" : "s"}  |  ${purchasedAt}`
  );

  if (!send) continue;

  const { error } = await resend.emails.send({
    from: `${FROM_NAME} <${fromEmail}>`,
    to: deliverTo,
    subject,
    html,
    text,
  });
  if (error) {
    console.error(`  FAIL ${rec.email}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`  sent`);
  }
  await new Promise((r) => setTimeout(r, 200));
}

if (!send) {
  console.log("\nNo emails sent. Re-run with --send after you fill SHOW_NOTES_HTML.");
}
