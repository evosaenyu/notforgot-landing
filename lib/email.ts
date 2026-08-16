import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM = process.env.SENDGRID_FROM_EMAIL!;

// ─── Types ────────────────────────────────────────────────────────────────────
export type TicketLineItem = {
  name: string;      // e.g. "Early Bird"
  quantity: number;
  unitPrice: number; // dollars
};

export type TicketConfirmationData = {
  customerName: string;
  customerEmail: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  lineItems: TicketLineItem[];
  totalDollars: number;
};

// ─── HTML Template ────────────────────────────────────────────────────────────
function buildTicketConfirmationHtml(d: TicketConfirmationData): string {
  const rows = d.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 16px;color:#e9d5ff;font-size:14px;border-bottom:1px solid #3b1f5e;">${item.name}</td>
        <td style="padding:10px 16px;color:#e9d5ff;font-size:14px;text-align:center;border-bottom:1px solid #3b1f5e;">${item.quantity}</td>
        <td style="padding:10px 16px;color:#e9d5ff;font-size:14px;text-align:right;border-bottom:1px solid #3b1f5e;">$${item.unitPrice}</td>
        <td style="padding:10px 16px;color:#ffa5f9;font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid #3b1f5e;">$${item.quantity * item.unitPrice}</td>
      </tr>`
    )
    .join("");

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
            <td style="background:linear-gradient(135deg,#2d0a4e,#4a1080);border-radius:12px 12px 0 0;padding:40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#ffa5f9;">N . F . G . C O L L E C T I V E</p>
              <h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">You&rsquo;re confirmed.</h1>
              <p style="margin:12px 0 0;font-size:16px;color:#d8b4fe;">We are so excited to see you!</p>
            </td>
          </tr>

          <!-- Event details -->
          <tr>
            <td style="background-color:#1e0a38;padding:28px 32px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Event</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${d.eventName}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:12px;">
                          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Date</p>
                          <p style="margin:0;font-size:15px;color:#e9d5ff;">${d.eventDate}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9d73c8;">Venue</p>
                          <p style="margin:0;font-size:15px;color:#e9d5ff;">${d.eventVenue}</p>
                        </td>
                      </tr>
                    </table>
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

          <!-- CTA / note -->
          <tr>
            <td style="background-color:#160830;padding:24px 32px 32px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
              <p style="margin:0;font-size:14px;color:#9d73c8;line-height:1.6;">
                Keep this email as your confirmation. Doors details and any updates will be sent to 
                <strong style="color:#e9d5ff;">${d.customerEmail}</strong>.
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

// ─── Text fallback ────────────────────────────────────────────────────────────
function buildTicketConfirmationText(d: TicketConfirmationData): string {
  const lines = d.lineItems.map(
    (i) => `  ${i.name} x${i.quantity} — $${i.quantity * i.unitPrice}`
  );
  return [
    `N.F.G. COLLECTIVE — Ticket Confirmation`,
    ``,
    `Hey ${d.customerName.split(" ")[0]}, you're confirmed for ${d.eventName}!`,
    ``,
    `DATE:  ${d.eventDate}`,
    `VENUE: ${d.eventVenue}`,
    ``,
    `ORDER`,
    ...lines,
    `──────────────────────`,
    `Total paid: $${d.totalDollars}`,
    ``,
    `Keep this email as your confirmation.`,
    `Questions? @nfgxcollective on Instagram.`,
    ``,
    `© ${new Date().getFullYear()} N.F.G. Records LLC`,
  ].join("\n");
}

// ─── Send function ────────────────────────────────────────────────────────────
function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

export async function sendDeluxeCouponSignup(
  customerName: string,
  customerEmail: string,
  /** Code or ID you show subscribers (may match Stripe promo code wording). */
  promoCodeDisplay: string
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return;

  const firstName = escapeHtmlText(customerName.trim().split(/\s+/)[0] ?? customerName.trim());
  const safeCodeDisplay = promoCodeDisplay ? escapeHtmlText(promoCodeDisplay) : "";
  const hasCode = Boolean(promoCodeDisplay.trim());

  const msg = {
    to: { email: customerEmail, name: customerName },
    from: { email: FROM, name: "NFG Collective" },
    subject: hasCode ? "Welcome to the Collective — your $5 off code" : "Welcome to the Collective",
    text: [
      `Hi ${customerName.trim().split(/\s+/)[0] ?? customerName.trim()},`,
      ``,
      `Welcome to the Collective! We'll let you know about future events, discount codes, and giveaways through here.`,
      ``,
      hasCode
        ? `Your $5 off Early Bird or General Admission code: ${promoCodeDisplay.trim()}`
        : null,
      hasCode
        ? `Enter it at checkout when you buy Early Bird or General Admission tickets.`
        : null,
      hasCode ? `` : null,
      `— N.F.G. Collective`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#1a0a2e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a0a2e;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1e0a38;border-radius:12px;border:1px solid #3b1f5e;">
        <tr><td style="padding:36px 32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#ffa5f9;">N.F.G. COLLECTIVE</p>
          <h1 style="margin:0;font-size:26px;color:#ffffff;">Welcome to the Collective!</h1>
          <p style="margin:16px 0 0;font-size:15px;color:#e9d5ff;line-height:1.6;">
            Hey ${firstName}, we&rsquo;ll let you know about future events, discount codes, and giveaways through here.
          </p>
          ${
            hasCode
              ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                  <tr><td style="border-radius:10px;border:1px solid rgba(255,165,249,0.35);background:#160830;padding:20px 24px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ffa5f9;">Your $5 off code</p>
                    <p style="margin:0;font-size:28px;font-weight:700;color:#ffa5f9;letter-spacing:2px;">${safeCodeDisplay}</p>
                    <p style="margin:12px 0 0;font-size:13px;color:#d8b4fe;line-height:1.5;">Enter this at checkout for Early Bird or General Admission tickets.</p>
                  </td></tr>
                </table>`
              : ``
          }
          <p style="margin:24px 0 0;font-size:13px;color:#9d73c8;line-height:1.5;">Questions? Find us on <a href="https://www.instagram.com/nfgxcollective/" style="color:#ffa5f9;text-decoration:none;">@nfgxcollective</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };

  await sgMail.send(msg);
}

export async function sendTicketConfirmation(data: TicketConfirmationData) {
  const msg = {
    to: { email: data.customerEmail, name: data.customerName },
    from: { email: FROM, name: "N.F.G. Collective" },
    subject: `🎟 You're confirmed — ${data.eventName}`,
    html: buildTicketConfirmationHtml(data),
    text: buildTicketConfirmationText(data),
  };

  await sgMail.send(msg);
}

const TEAM_INBOX = "nfgnycofficial@gmail.com";

export async function sendComingToSeePurchaseAlert(opts: {
  comingToSee: string;
  customerName: string;
  customerEmail: string | null;
  ticketCount: number;
  totalDollars: number;
  eventName: string;
}): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return;

  const artist = opts.comingToSee.trim();
  const buyer = opts.customerName.trim() || "Guest";
  const email = opts.customerEmail?.trim() || "no email";
  const tickets = opts.ticketCount === 1 ? "1 ticket" : `${opts.ticketCount} tickets`;

  await sgMail.send({
    to: TEAM_INBOX,
    from: { email: FROM, name: "N.F.G. Collective" },
    subject: `Coming to see: ${artist}`,
    text: [
      `Coming to see: ${artist}`,
      ``,
      `Buyer: ${buyer}`,
      `Email: ${email}`,
      `Tickets: ${tickets}`,
      `Paid: $${opts.totalDollars}`,
      `Event: ${opts.eventName}`,
    ].join("\n"),
  });
}
