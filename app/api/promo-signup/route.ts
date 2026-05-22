import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendDeluxeCouponSignup } from "@/lib/email";
import { PROMO_MODAL_SOURCE, upsertPromoSignup } from "@/lib/promo-signups";
import { DELUXE_PROMO_COOKIE, mintDeluxePromoCookie } from "@/lib/promo-cookie";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email().max(320),
});

/** Customer-facing promo code characters (Stripe → Promotion codes). Not the internal promo_ API id. */
function displayPromoCode(): string {
  return (process.env.NEXT_PUBLIC_DELUXE_PROMO_CODE ?? "").trim();
}

export async function POST(req: NextRequest) {
  let parsedBody: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    const result = bodySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 });
    }
    parsedBody = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const promoDisplay = displayPromoCode();
  const nameTrimmed = parsedBody.name.trim();
  const emailNorm = parsedBody.email.trim().toLowerCase();

  const { error: persistError } = await upsertPromoSignup({
    fullName: nameTrimmed,
    email: emailNorm,
    signupSource: PROMO_MODAL_SOURCE,
    couponCodeDisplay: promoDisplay || null,
  });
  if (persistError) {
    console.error("[promo-signup] promo_signups upsert:", persistError.message);
  }

  try {
    await sendDeluxeCouponSignup(nameTrimmed, emailNorm, promoDisplay);
  } catch (e) {
    console.error("[promo-signup] sendDeluxeCouponSignup:", e);
    /* still return success surface so UX isn’t blocked if email fails */
  }

  const token = mintDeluxePromoCookie();
  const res = NextResponse.json({
    ok: true,
    couponDisplay: promoDisplay,
    unlockedAutomaticDiscount: Boolean(token),
  });

  if (token) {
    res.cookies.set(DELUXE_PROMO_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 3600,
    });
  }

  return res;
}
