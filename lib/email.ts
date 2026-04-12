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
              <p style="margin:12px 0 0;font-size:16px;color:#d8b4fe;">See you there, ${d.customerName.split(" ")[0]}.</p>
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
