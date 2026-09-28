export const COMING_TO_SEE_ARTISTS = [
  { id: "noelia", label: "Noelia" },
  { id: "tay-harmony", label: "Tay Harmony" },
  { id: "pocket-fuel-groovers", label: "Pocket Fuel Groovers" },
  { id: "serena", label: "Serena" },
  { id: "far-from-over", label: "Far From Over" },
  { id: "soulflower", label: "SoulFlower" },
  { id: "justin-drury", label: "Justin Drury" },
  { id: "kay-hollins", label: "KAY Hollins" },
  { id: "v-anie", label: "V. Anie" },
  { id: "maleek", label: "Maleek" },
  { id: "molly-indigo", label: "Molly Indigo" },
] as const;

export type ComingToSeeId = (typeof COMING_TO_SEE_ARTISTS)[number]["id"];

export type ComingToSeeArtist = (typeof COMING_TO_SEE_ARTISTS)[number];

export function parseComingToSee(value: unknown): ComingToSeeArtist | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return COMING_TO_SEE_ARTISTS.find((artist) => artist.id === id) ?? null;
}

export function parseComingToSeeList(value: unknown): ComingToSeeArtist[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const seen = new Set<ComingToSeeId>();
  const artists: ComingToSeeArtist[] = [];
  for (const item of raw) {
    const artist = parseComingToSee(item);
    if (artist && !seen.has(artist.id)) {
      seen.add(artist.id);
      artists.push(artist);
    }
  }
  return artists;
}

export function formatComingToSeeLabels(artists: ComingToSeeArtist[]): string {
  return artists.map((artist) => artist.label).join(", ");
}
