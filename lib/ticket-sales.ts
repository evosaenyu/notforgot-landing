/** Flip to false after the show to hide checkout/RSVP. */
const TICKET_SALES_OPEN = true;

/** Flip to false to hide paid checkout while keeping RSVP. */
const PAID_TICKETS_OPEN = false;

/** Renaissance Night has no promo — keep Stripe checkout from offering or auto-applying codes. */
export const CHECKOUT_COUPONS_ENABLED = false;

/** Guest list / RSVP for Renaissance Night. */
export const PARTIFUL_RSVP_URL =
  "https://partiful.com/e/OoNVrPfjVE6qgTIkemcK?c=k2iQUzDf";

export function isTicketSalesEnabled(): boolean {
  return TICKET_SALES_OPEN;
}

export function isPaidTicketsEnabled(): boolean {
  return TICKET_SALES_OPEN && PAID_TICKETS_OPEN;
}

const EVENT_TIME_ZONE = "America/New_York";

export function formatEventDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: EVENT_TIME_ZONE,
    timeZoneName: "short",
  });
}
