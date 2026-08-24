/** When unset, ticket sales stay enabled (existing deployments). Set to `false` to hide checkout UI. */
export function isTicketSalesEnabled(): boolean {
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
