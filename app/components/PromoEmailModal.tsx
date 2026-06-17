"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Once shown or dismissed, do not show again (years). */
const MODAL_SEEN_COOKIE = "nfg_email_promo_modal_seen";
const COOKIE_MAX_AGE_DAYS = 400;

function getCookie(name: string): string | null {
  const m = typeof document !== "undefined" ? document.cookie.match(`(?:^|; )${name}=([^;]*)`) : null;
  return m ? decodeURIComponent(m[1]) : null;
}

function setSeenCookie(): void {
  document.cookie = `${MODAL_SEEN_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE_DAYS * 86400}; SameSite=Lax`;
}

/** Customer-facing Stripe promotion code — set NEXT_PUBLIC_DELUXE_PROMO_CODE (not the internal promo_* id). */
const FALLBACK_PROMO_DISPLAY = (process.env.NEXT_PUBLIC_DELUXE_PROMO_CODE ?? "").trim();

export default function PromoEmailModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [couponDisplay, setCouponDisplay] = useState("");
  const [autoUnlock, setAutoUnlock] = useState(false);

  useEffect(() => {
    if (getCookie(MODAL_SEEN_COOKIE)) return undefined;
    const timer = window.setTimeout(() => setOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const handleClose = (): void => {
    setSeenCookie();
    setOpen(false);
  };

  const handleOpenChange = (next: boolean): void => {
    if (!next) handleClose();
    else setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/promo-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        couponDisplay?: string;
        unlockedAutomaticDiscount?: boolean;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      setCouponDisplay(data.couponDisplay || FALLBACK_PROMO_DISPLAY);
      setAutoUnlock(Boolean(data.unlockedAutomaticDiscount));
      setSeenCookie();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not submit. Try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[420px] border border-amber-200/15 bg-purple-950/95 text-amber-100 shadow-xl shadow-purple-950/70 sm:rounded-xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl text-white tracking-tight">$5 off Early Bird or General Admission</DialogTitle>
          <DialogDescription className="text-amber-200/70 leading-relaxed">
            Drop your name and email and we&apos;ll send your coupon. You&apos;ll see your code below too.
          </DialogDescription>
        </DialogHeader>

        {status === "form" || status === "loading" || status === "error" ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="promo-name" className="text-amber-200/90">
                Name
              </Label>
              <Input
                id="promo-name"
                autoComplete="name"
                placeholder="Jamie Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "loading"}
                required
                className="border-amber-200/25 bg-purple-950/80 text-white placeholder:text-amber-200/35 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-email" className="text-amber-200/90">
                Email
              </Label>
              <Input
                id="promo-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                required
                className="border-amber-200/25 bg-purple-950/80 text-white placeholder:text-amber-200/35 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            {status === "error" && errorMsg ? (
              <p className="text-sm text-red-300">{errorMsg}</p>
            ) : null}
            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#ffa5f9] text-black hover:bg-[#FFD5FC] font-semibold"
            >
              {status === "loading" ? "Sending…" : "Email me $5 off"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            {(couponDisplay || FALLBACK_PROMO_DISPLAY).trim() ? (
              <>
                <p className="text-amber-100/90 text-sm leading-relaxed">
                  Check your inbox for details. Save this code for Early Bird or General Admission checkout
                  {autoUnlock
                    ? " — from this browser, your $5 off may apply automatically when you buy Early Bird or General Admission."
                    : "."}
                </p>
                <div className="rounded-lg border border-[#ffa5f9]/30 bg-purple-950/60 px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-[#ffa5f9]/80 mb-1">
                    Your code
                  </p>
                  <p className="text-lg font-semibold text-[#ffa5f9] tracking-wide">
                    {(couponDisplay || FALLBACK_PROMO_DISPLAY).trim()}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-amber-100/90 text-sm leading-relaxed">
                Check your inbox — we emailed your promo code.
                {autoUnlock
                  ? " From this browser it may apply automatically when you buy Early Bird or General Admission."
                  : " Enter it during checkout when buying Early Bird or General Admission."}
              </p>
            )}
            <Button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#ffa5f9] text-black hover:bg-[#FFD5FC] font-semibold"
            >
              Got it
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
