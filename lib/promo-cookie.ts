import { createHmac, timingSafeEqual } from "crypto";

/** HttpOnly cookie set after signup; validates eligibility for automated Stripe coupon. */
export const DELUXE_PROMO_COOKIE = "nfg_dx_promo";

const PROMO_COOKIE_HMAC_PURPOSE = "nfg-landing|deluxe-promo-cookie|v1";

/**
 * Signing key tied to Stripe secret + promo API id (`STRIPE_PROMO_COUPON_ID`).
 * The promo id alone is guessable/leakable; hashing with Stripe secret avoids separate PROMO_SIGNING_SECRET.
 */
function derivePromoCookieSigningKeyMaterial(): string | null {
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const deluxePromoApiId = process.env.STRIPE_PROMO_COUPON_ID?.trim();
  if (!stripeSecret || !deluxePromoApiId) return null;
  return createHmac("sha256", stripeSecret)
    .update(`${PROMO_COOKIE_HMAC_PURPOSE}|${deluxePromoApiId}`)
    .digest("base64url");
}

export function mintDeluxePromoCookie(): string | null {
  const keyMaterial = derivePromoCookieSigningKeyMaterial();
  if (!keyMaterial) return null;
  const exp = Math.floor(Date.now() / 1000) + 90 * 24 * 3600;
  const payload = JSON.stringify({ exp, v: 1 });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", keyMaterial).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyDeluxePromoCookie(token: string | undefined | null): boolean {
  const keyMaterial = derivePromoCookieSigningKeyMaterial();
  if (!token || !keyMaterial) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payloadB64 = token.slice(0, lastDot);
  const sigB64 = token.slice(lastDot + 1);
  const expectedSig = createHmac("sha256", keyMaterial).update(payloadB64).digest("base64url");
  const a = Buffer.from(sigB64);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  try {
    if (!timingSafeEqual(Uint8Array.from(a), Uint8Array.from(b))) return false;
  } catch {
    return false;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (typeof payload !== "object" || payload === null) return false;
  const exp = (payload as { exp?: unknown }).exp;
  return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
}
