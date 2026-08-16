export const COMING_TO_SEE_ARTISTS = [
  { id: "vetter", label: "Vetter" },
  { id: "wes", label: "Wes" },
  { id: "ramya", label: "Ramya" },
  { id: "still-summer", label: "Still Summer" },
  { id: "tevin-williams", label: "Tevin Williams" },
  { id: "lj-the-vagabond", label: "LJ The Vagabond" },
  { id: "nfg-collective", label: "N.F.G. Collective" },
  { id: "lexa", label: "Lexa" },
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
