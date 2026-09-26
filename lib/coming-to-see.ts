export const COMING_TO_SEE_ARTISTS = [
  { id: "noelia", label: "Noelia" },
  { id: "dave-langston", label: "Dave Langston" },
  { id: "tandee", label: "Tandee" },
  { id: "tay-harmony", label: "Tay Harmony" },
  { id: "soulflower", label: "SoulFlower" },
  { id: "vanie", label: "Vanie" },
  { id: "pocket-full-groovers", label: "The Pocket Full Groovers" },
  { id: "justin-drury", label: "Justin Drury" },
  { id: "maleek", label: "Maleek" },
  { id: "serena", label: "Serena" },
  { id: "kay-hollins", label: "Kay Hollins" },
  { id: "far-from-over", label: "Far From Over" },
  { id: "molly-indigo", label: "Molly Indigo" },
  { id: "nfg-collective", label: "N.F.G. Collective" },
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
