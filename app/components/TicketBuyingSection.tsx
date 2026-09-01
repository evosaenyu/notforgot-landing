"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Minus, Plus, Ticket, ArrowLeft, Heart, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { isTicketSalesEnabled } from "@/lib/ticket-sales";
import { type ComingToSeeId } from "@/lib/coming-to-see";
import ComingToSeePicker from "./ComingToSeePicker";

const ticketSalesEnabled = isTicketSalesEnabled();
const PARTIFUL_RSVP_URL = "https://partiful.com/e/vWDEqX9Zi3D86rL0jIfT";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tier = {
  id: string;
  tierId: string;
  label: string;
  description: string;
  priceId: string;
  price: number;
  isPayWhatYouWant?: boolean;
  payWhatYouWantMinimum?: number;
  remaining: number;
  max: number;
};

type EventInfo = {
  name: string;
  date: string;
  description: string;
  venue: string;
};

type Cart = Record<string, number>;
type AttendanceChoice = "free" | "donate";

async function submitFreeRsvp(payload: {
  name: string;
  email: string;
  phone: string;
  tierKey: string;
  comingToSee: ComingToSeeId[];
}) {
  const res = await fetch("/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Failed to submit RSVP");
  }
}

// ─── Stripe checkout ─────────────────────────────────────────────────────────
async function startCheckout(cart: Cart, tiers: Tier[], comingToSee: ComingToSeeId[]) {
  const lineItems = tiers.flatMap((tier) => {
    const qty = cart[tier.id] ?? 0;
    if (qty === 0) return [];
    return [{ priceId: tier.priceId, quantity: qty }];
  });

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ lineItems, comingToSee }),
  });

  const data = await res.json();

  if (!res.ok || !data.url) {
    throw new Error(data.error || "Failed to start checkout");
  }

  window.location.href = data.url;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TicketBuyingSection() {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attendanceChoice, setAttendanceChoice] = useState<AttendanceChoice | null>(null);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [comingToSee, setComingToSee] = useState<ComingToSeeId[]>([]);
  const [comingToSeeError, setComingToSeeError] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const pwywTier = tiers.find((t) => t.isPayWhatYouWant) ?? null;
  const isPwywOnly = tiers.length > 0 && tiers.every((t) => t.isPayWhatYouWant);

  // Detect ?checkout=success or ?rsvp=success return
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success" || params.get("rsvp") === "success") {
      setShowSuccess(true);
      window.history.replaceState({}, "", window.location.pathname + "#tickets");
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!ticketSalesEnabled) {
      setIsLoadingData(false);
      return;
    }
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setEvent(data.event ?? null);
        setTiers(data.tiers ?? []);
        const initial: Cart = {};
        (data.tiers ?? []).forEach((t: Tier) => { initial[t.id] = 0; });
        setCart(initial);
      })
      .catch(() => setError("Failed to load tickets"))
      .finally(() => setIsLoadingData(false));
  }, []);

  const adjust = (id: string, delta: number) => {
    const tier = tiers.find((t) => t.id === id)!;
    setCart((prev) => ({
      ...prev,
      [id]: Math.min(Math.max(0, (prev[id] ?? 0) + delta), Math.min(tier.max, tier.remaining)),
    }));
  };

  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
  const hasPayWhatYouWant = tiers.some((t) => t.isPayWhatYouWant && (cart[t.id] ?? 0) > 0);
  const totalPrice = tiers.reduce((sum, t) => sum + (cart[t.id] ?? 0) * t.price, 0);

  const canPurchase =
    ticketSalesEnabled && event !== null && tiers.length > 0;
  const showUpcomingEvent = ticketSalesEnabled && event !== null;

  const hasComingToSee = comingToSee.length > 0;

  const selectComingToSee = (next: ComingToSeeId[]) => {
    setComingToSee(next);
    setComingToSeeError(false);
    if (checkoutError === "Pick who you're coming to see") {
      setCheckoutError(null);
    }
    if (rsvpError === "Pick who you're coming to see") {
      setRsvpError(null);
    }
  };

  const proceedToCheckout = async () => {
    if (totalQty === 0 || isCheckingOut || !hasComingToSee) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      await startCheckout(cart, tiers, comingToSee);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
      setIsCheckingOut(false);
    }
  };

  const handleCheckout = () => {
    if (totalQty === 0 || isCheckingOut) return;
    if (!hasComingToSee) {
      setComingToSeeError(true);
      setCheckoutError("Pick who you're coming to see");
      return;
    }
    void proceedToCheckout();
  };

  const selectDonate = () => {
    if (!pwywTier) return;
    setAttendanceChoice("donate");
    setCart({ [pwywTier.id]: 1 });
    setCheckoutError(null);
  };

  const selectFree = () => {
    setAttendanceChoice("free");
    setRsvpError(null);
  };

  const resetChoice = () => {
    setAttendanceChoice(null);
    setRsvpName("");
    setRsvpEmail("");
    setRsvpPhone("");
    setRsvpError(null);
    setCheckoutError(null);
    const initial: Cart = {};
    tiers.forEach((t) => { initial[t.id] = 0; });
    setCart(initial);
  };

  const handleFreeRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwywTier || isSubmittingRsvp) return;
    if (!hasComingToSee) {
      setComingToSeeError(true);
      setRsvpError("Pick who you're coming to see");
      return;
    }
    setIsSubmittingRsvp(true);
    setRsvpError(null);
    try {
      await submitFreeRsvp({
        name: rsvpName,
        email: rsvpEmail,
        phone: rsvpPhone,
        tierKey: pwywTier.id,
        comingToSee,
      });
      setShowSuccess(true);
      resetChoice();
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setRsvpError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const pwywMinLabel =
    pwywTier?.payWhatYouWantMinimum != null
      ? `$${pwywTier.payWhatYouWantMinimum}+`
      : "You choose";

  return (
    <section
      id="tickets"
      ref={sectionRef}
      className="relative py-16 px-4 flex flex-col items-center scroll-mt-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto"
      >
        {/* Success banner */}
        {showSuccess && (
          <div className="mb-6 rounded-lg bg-green-500/15 border border-green-500/30 px-5 py-4 text-green-300 text-sm flex items-center gap-3">
            <span className="text-lg">🎉</span>
            <span>
              <span className="font-semibold">You&apos;re in!</span> Check your email for your ticket confirmation.
            </span>
          </div>
        )}
        {/* Event poster */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex justify-center"
        >
          <Image
            src="/assets/frasfestontour.jpg"
            alt="FRAS FEST ON TOUR event poster"
            width={480}
            height={480}
            className="rounded-xl object-contain max-h-[420px] w-auto shadow-lg shadow-purple-950/60"
            priority
          />
        </motion.div>
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-2 mb-6">
          <Ticket className="w-5 h-5 text-[#ffa5f9] flex-shrink-0 self-center" />
          <h2 className="text-white font-semibold text-lg">
            {showUpcomingEvent ? "Get tickets to our next show:" : "Thank you"}
          </h2>
          {event && showUpcomingEvent ? (
            <div className="flex flex-col gap-1">
              <span className="text-[#ffa5f9] font-semibold text-lg">{event.name}</span>
              <span className="text-amber-200/60 text-base">{event.venue}</span>
              <p className="text-amber-200/50 text-sm mt-0.5">{event.description}</p>
              <span className="text-amber-200/60 text-base">{event.date}</span>
            </div>
          ) : (
            !error && isLoadingData && (
              <span className="text-amber-200/30 text-sm animate-pulse">Loading…</span>
            )
          )}
        </div>

        {!isLoadingData && !error && !showUpcomingEvent && (
          <p className="text-amber-200/70 text-center text-base mb-6">
            We had such a blast with you at the last event!
          </p>
        )}

        {/* Partiful RSVP + door tickets when online Stripe tiers are not configured */}
        {!isLoadingData && !error && showUpcomingEvent && !canPurchase && (
          <div className="rounded-xl border border-amber-200/10 bg-purple-950/40 backdrop-blur-sm overflow-hidden divide-y divide-amber-200/10 mb-4">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium">RSVP on Partiful</span>
                <p className="text-amber-200/50 text-xs mt-0.5">
                  Reserve your spot and see who&apos;s going
                </p>
              </div>
              <Button
                asChild
                className="bg-[#ffa5f9] hover:bg-[#FFD5FC] text-black font-semibold shrink-0"
              >
                <a href={PARTIFUL_RSVP_URL} target="_blank" rel="noopener noreferrer">
                  RSVP
                </a>
              </Button>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium">In-person Tickets</span>
                <p className="text-amber-200/50 text-xs mt-0.5">
                  Purchase at the door on the day of the event
                </p>
              </div>
              <span className="text-amber-200/80 font-medium tabular-nums w-14 text-right shrink-0">
                $25
              </span>
              <span className="text-amber-200/40 text-xs shrink-0 w-[88px] text-center mr-3">
                Door only
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <p className="text-red-400/80 text-sm text-center py-8">{error}</p>
        )}

        {/* Loading skeleton */}
        {isLoadingData && !error && canPurchase && (
          <div className="rounded-xl border border-amber-200/10 bg-purple-950/40 overflow-hidden divide-y divide-amber-200/10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-32" />
                  <div className="h-2 bg-white/5 rounded w-48" />
                </div>
                <div className="h-3 bg-white/10 rounded w-10" />
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                  <div className="w-5 h-8" />
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PWYW: choose free RSVP vs donate before checkout */}
        {!isLoadingData && !error && canPurchase && isPwywOnly && pwywTier && !attendanceChoice && (
          <div className="rounded-xl border border-amber-200/10 bg-purple-950/40 backdrop-blur-sm overflow-hidden p-5 space-y-4">
            <p className="text-white font-medium text-center">
              How would you like to attend?
            </p>
            <p className="text-amber-200/50 text-xs text-center -mt-2">
              Donating is fully optional, so pull thru if you can!
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={selectFree}
                className="rounded-lg border border-amber-200/20 bg-purple-950/60 px-4 py-5 text-left hover:border-[#ffa5f9] hover:bg-purple-900/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TicketCheck className="w-4 h-4 text-[#ffa5f9]" />
                  <span className="text-white font-medium">Free RSVP</span>
                </div>
                <p className="text-amber-200/50 text-xs leading-relaxed">
                  Reserve your spot at no cost. No payment required.
                </p>
              </button>
              <button
                type="button"
                onClick={selectDonate}
                disabled={pwywTier.remaining === 0}
                className="rounded-lg border border-amber-200/20 bg-purple-950/60 px-4 py-5 text-left hover:border-[#ffa5f9] hover:bg-purple-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-[#ffa5f9]" />
                  <span className="text-white font-medium">Donate &amp; attend</span>
                </div>
                <p className="text-amber-200/50 text-xs leading-relaxed">
                  Pay what you want ({pwywMinLabel} min) to support the fundraiser.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* PWYW: free RSVP form */}
        {!isLoadingData && !error && canPurchase && isPwywOnly && pwywTier && attendanceChoice === "free" && (
          <form
            onSubmit={handleFreeRsvp}
            className="rounded-xl border border-amber-200/10 bg-purple-950/40 backdrop-blur-sm overflow-hidden p-5 space-y-4"
          >
            <button
              type="button"
              onClick={resetChoice}
              className="flex items-center gap-1.5 text-amber-200/60 text-xs hover:text-[#ffa5f9] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div>
              <h3 className="text-white font-medium">Free RSVP</h3>
              <p className="text-amber-200/50 text-xs mt-1">
                Tell us who&apos;s coming — we&apos;ll email your confirmation.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rsvp-name" className="text-amber-200/70">Name</Label>
                <Input
                  id="rsvp-name"
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  required
                  className="border-amber-200/20 bg-purple-950/60 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rsvp-email" className="text-amber-200/70">Email</Label>
                <Input
                  id="rsvp-email"
                  type="email"
                  value={rsvpEmail}
                  onChange={(e) => setRsvpEmail(e.target.value)}
                  required
                  className="border-amber-200/20 bg-purple-950/60 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rsvp-phone" className="text-amber-200/70">Phone</Label>
                <Input
                  id="rsvp-phone"
                  type="tel"
                  value={rsvpPhone}
                  onChange={(e) => setRsvpPhone(e.target.value)}
                  required
                  className="border-amber-200/20 bg-purple-950/60 text-white"
                />
              </div>
            </div>
            <ComingToSeePicker
              value={comingToSee}
              onChange={selectComingToSee}
              invalid={comingToSeeError}
            />
            {rsvpError && <p className="text-red-400/80 text-xs">{rsvpError}</p>}
            <Button
              type="submit"
              disabled={isSubmittingRsvp || !hasComingToSee}
              className="w-full bg-[#ffa5f9] hover:bg-[#FFD5FC] text-black font-semibold disabled:opacity-40"
            >
              {isSubmittingRsvp ? "Submitting…" : "Confirm free RSVP"}
            </Button>
          </form>
        )}

        {/* PWYW: donate checkout */}
        {!isLoadingData && !error && canPurchase && isPwywOnly && pwywTier && attendanceChoice === "donate" && (
          <div className="rounded-xl border border-amber-200/10 bg-purple-950/40 backdrop-blur-sm overflow-hidden divide-y divide-amber-200/10">
            <div className="px-5 py-4">
              <button
                type="button"
                onClick={resetChoice}
                className="flex items-center gap-1.5 text-amber-200/60 text-xs hover:text-[#ffa5f9] transition-colors mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium">{pwywTier.label}</span>
                  <p className="text-amber-200/50 text-xs mt-0.5">
                    Choose your donation at checkout ({pwywMinLabel} minimum).
                  </p>
                </div>
                <span className="text-amber-200/80 font-medium tabular-nums shrink-0">
                  {pwywMinLabel}
                </span>
              </div>
            </div>
            <div className="px-5 py-4">
              <ComingToSeePicker
                value={comingToSee}
                onChange={selectComingToSee}
                invalid={comingToSeeError}
              />
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-amber-200/50 text-sm">
                1 ticket &mdash;{" "}
                <span className="text-[#ffa5f9] font-semibold">amount chosen at checkout</span>
              </p>
              {checkoutError && (
                <p className="text-red-400/80 text-xs">{checkoutError}</p>
              )}
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut || pwywTier.remaining === 0 || !hasComingToSee}
                className="bg-[#ffa5f9] hover:bg-[#FFD5FC] text-black font-semibold px-8 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Loading…
                  </span>
                ) : (
                  "Continue to checkout"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Standard ticket tiers (non-PWYW events) */}
        {!isLoadingData && !error && canPurchase && !isPwywOnly && tiers.length > 0 && (
          <div className="rounded-xl border border-amber-200/10 bg-purple-950/40 backdrop-blur-sm overflow-hidden divide-y divide-amber-200/10">
            {tiers.map((tier, i) => {
              const qty = cart[tier.id] ?? 0;
              const soldOut = tier.remaining === 0;
              const atMax = qty >= Math.min(tier.max, tier.remaining);

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i + 1) * 0.08, duration: 0.4 }}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  {/* Tier info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{tier.label}</span>
                      {soldOut && (
                        <span className="text-[10px] uppercase tracking-wide bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
                          Sold out
                        </span>
                      )}
                      {!soldOut && tier.remaining <= 20 && (
                        <span className="text-[10px] uppercase tracking-wide bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded px-1.5 py-0.5">
                          {tier.remaining} left
                        </span>
                      )}
                    </div>
                    <p className="text-amber-200/50 text-xs mt-0.5">{tier.description}</p>
                  </div>

                  {/* Price — from Stripe */}
                  <span className="text-amber-200/80 font-medium tabular-nums w-14 text-right shrink-0">
                    {tier.isPayWhatYouWant ? (
                      tier.payWhatYouWantMinimum != null
                        ? `$${tier.payWhatYouWantMinimum}+`
                        : "You choose"
                    ) : (
                      `$${tier.price}`
                    )}
                  </span>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => adjust(tier.id, -1)}
                      disabled={qty === 0}
                      aria-label={`Remove one ${tier.label}`}
                      className="w-8 h-8 rounded-full border border-amber-200/20 flex items-center justify-center text-amber-200/70 hover:border-[#ffa5f9] hover:text-[#ffa5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-5 text-center text-white tabular-nums text-sm">
                      {qty}
                    </span>

                    <button
                      onClick={() => adjust(tier.id, 1)}
                      disabled={soldOut || atMax}
                      aria-label={`Add one ${tier.label}`}
                      className="w-8 h-8 rounded-full border border-amber-200/20 flex items-center justify-center text-amber-200/70 hover:border-[#ffa5f9] hover:text-[#ffa5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {/* Static in-person tier */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (tiers.length + 1) * 0.08, duration: 0.4 }}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">In-person Tickets</span>
                </div>
                <p className="text-amber-200/50 text-xs mt-0.5">Purchase at the door on the day of the event</p>
              </div>
              <span className="text-amber-200/80 font-medium tabular-nums w-14 text-right shrink-0">
                $25
              </span>
              <span className="text-amber-200/40 text-xs shrink-0 w-[88px] text-center mr-3">
                Door only
              </span>
            </motion.div>
          </div>
        )}

        {/* Footer / checkout (non-PWYW events) */}
        {!isLoadingData && !error && canPurchase && !isPwywOnly && (
          <div className="mt-4 space-y-3">
            <p className="text-[#ffa5f9]/90 text-sm font-medium">
              No extra fees!! We cover all that shi
            </p>
            <div className="rounded-xl border border-amber-200/10 bg-purple-950/40 backdrop-blur-sm p-5">
              <ComingToSeePicker
                value={comingToSee}
                onChange={selectComingToSee}
                invalid={comingToSeeError}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-amber-200/50 text-sm">
                {totalQty > 0 ? (
                  <>
                    <span className="text-white font-medium">{totalQty}</span>{" "}
                    {totalQty === 1 ? "ticket" : "tickets"}
                    {hasPayWhatYouWant ? (
                      <> &mdash; <span className="text-[#ffa5f9] font-semibold">amount chosen at checkout</span></>
                    ) : (
                      <> &mdash; <span className="text-[#ffa5f9] font-semibold">${totalPrice}</span></>
                    )}
                  </>
                ) : (
                  "No tickets selected"
                )}
              </div>

              {checkoutError && (
                <p className="text-red-400/80 text-xs">{checkoutError}</p>
              )}
              <Button
                onClick={handleCheckout}
                disabled={totalQty === 0 || isCheckingOut || !hasComingToSee}
                title={!hasComingToSee ? "Pick who you're coming to see" : undefined}
                className="bg-[#ffa5f9] hover:bg-[#FFD5FC] text-black font-semibold px-8 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Loading…
                  </span>
                ) : (
                  "Checkout"
                )}
              </Button>
            </div>
            {totalQty > 0 && !hasComingToSee && (
              <p className="text-amber-200/45 text-xs">
                Pick who you&apos;re coming to see to unlock checkout
              </p>
            )}
          </div>
        )}
      </motion.div>
    </section>
  );
}
