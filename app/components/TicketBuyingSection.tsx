"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Minus, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tier = {
  id: string;
  tierId: string;
  label: string;
  description: string;
  priceId: string;
  price: number;
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

// ─── Stripe checkout ─────────────────────────────────────────────────────────
async function startCheckout(cart: Cart, tiers: Tier[]) {
  const lineItems = tiers.flatMap((tier) => {
    const qty = cart[tier.id] ?? 0;
    if (qty === 0) return [];
    return [{ priceId: tier.priceId, quantity: qty }];
  });

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ lineItems }),
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
  const sectionRef = useRef<HTMLElement>(null);

  // Detect ?checkout=success return from Stripe
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setShowSuccess(true);
      // Clean the query param from the URL without a reload
      window.history.replaceState({}, "", window.location.pathname + "#tickets");
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setEvent(data.event);
        setTiers(data.tiers);
        const initial: Cart = {};
        data.tiers.forEach((t: Tier) => { initial[t.id] = 0; });
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
  const totalPrice = tiers.reduce((sum, t) => sum + (cart[t.id] ?? 0) * t.price, 0);

  const handleCheckout = async () => {
    if (totalQty === 0 || isCheckingOut) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      await startCheckout(cart, tiers);
      // If we reach here, the redirect didn't happen — shouldn't occur normally
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
      setIsCheckingOut(false);
    }
  };

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
            src="/assets/nahpartyposter.png"
            alt="NAH Party event poster"
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
            Buy tickets to our next show:
          </h2>
          {event ? (
            <div className="flex flex-col gap-1">
              <span className="text-[#ffa5f9] font-semibold text-lg">{event.name}</span>
              <span className="text-amber-200/60 text-base">{event.venue}</span>
              <p className="text-amber-200/50 text-sm mt-0.5">{event.description}</p>
              <span className="text-amber-200/60 text-base">{event.date}</span>
            </div>
          ) : (
            !error && <span className="text-amber-200/30 text-sm animate-pulse">Loading…</span>
          )}
        </div>

        

        {/* Error state */}
        {error && (
          <p className="text-red-400/80 text-sm text-center py-8">{error}</p>
        )}

        {/* Loading skeleton */}
        {isLoadingData && !error && (
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

        {/* Ticket tiers */}
        {!isLoadingData && !error && tiers.length > 0 && (
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
                    ${tier.price}
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

        {/* Footer / checkout */}
        {!isLoadingData && !error && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-amber-200/50 text-sm">
              {totalQty > 0 ? (
                <>
                  <span className="text-white font-medium">{totalQty}</span>{" "}
                  {totalQty === 1 ? "ticket" : "tickets"} &mdash;{" "}
                  <span className="text-[#ffa5f9] font-semibold">${totalPrice}</span>
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
              disabled={totalQty === 0 || isCheckingOut}
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
        )}
      </motion.div>
    </section>
  );
}
