/** Flip to true (and set NEXT_PUBLIC_TICKET_SALES_ENABLED=true) when the next show goes on sale. */
const TICKET_SALES_OPEN = false;

/** When unset, ticket sales stay hidden after an event. Set to `true` to show checkout UI. */
export function isTicketSalesEnabled(): boolean {
  if (!TICKET_SALES_OPEN) return false;
  const raw = process.env.NEXT_PUBLIC_TICKET_SALES_ENABLED?.trim().toLowerCase();
  if (!raw) return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return raw === "true" || raw === "1" || raw === "yes";
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
