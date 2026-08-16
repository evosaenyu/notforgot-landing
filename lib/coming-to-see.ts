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
  return COMING_TO_SEE_ARTISTS.find((artist) => artist.id === value) ?? null;
}
