"use client";

import { Instagram, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import FloatingCircles from "./components/FloatingCircles";
import EventsSection from "./components/EventsSection";
import MusicSection from "./components/MusicSection";
import BlogSection from "./components/BlogSection";
import TicketBuyingSection from "./components/TicketBuyingSection";
import PromoEmailModal from "./components/PromoEmailModal";
import { isTicketSalesEnabled } from "@/lib/ticket-sales";
import BackgroundVideo from "./components/BackgroundVideo";
import { Button } from "@/components/ui/button";
import { Nabla, Monda } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const nabla = Nabla({ 
  subsets: ['latin'],
  display: 'block',
  variable: '--font-nabla',
  fallback: ['system-ui', 'arial'],
});

// Add variable font settings in CSS
const nablaStyle = {
  fontVariationSettings: '"EDPT" 100, "EHLT" 12'
};

const monda = Monda({
  subsets: ['latin'],
  weight: "400"
});
const generateRandomColors = () => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
    "#E74C3C",
    "#2ECC71",
    "#F1C40F",
    "#E67E22",
    "#1ABC9C",
    "#34495E",
    "#E84393",
  ];
  const shuffled = [...colors].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

const ticketSalesEnabled = isTicketSalesEnabled();

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [colors, setColors] = useState(["#FF6B6B", "#4ECDC4", "#45B7D1"]);

  useEffect(() => {    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    setColors(generateRandomColors());
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTickets = () => {
    document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <PromoEmailModal />
      <BackgroundVideo />
      <FloatingCircles />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative p-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-purple-950/70 to-transparent"
        />
        <div className="max-w-4xl w-[70w] space-y-8 text-center relative">
          <div className="relative h-[200px] flex items-center justify-center">
            <AnimatePresence>
              <motion.div
                key="NOT"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, x: -85, y: -60, scale: 1 }}
                transition={{ duration: 2, ease: "circInOut" }}
                className="absolute"
              >
                <span className={`text-[4.5em] animate-glow nabla-text nabla-purple ${nabla.className}`}>
                  <span className="brightness-150">N</span><span className="brightness-75">OT</span>
                </span>
              </motion.div>
              
              <motion.div
                key="FOR"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                transition={{ duration: 2, ease: "circInOut" }}
                className="absolute"
              >
                <span className={`text-[4.5em] animate-glow nabla-text nabla-purple ${nabla.className}`}>
                  <span className="brightness-150">F</span><span className="brightness-75">OR</span>
                </span>
              </motion.div>
              
              <motion.div
                key="GOT"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, x: 85, y: 60, scale: 1 }}
                transition={{ duration: 2, ease: "circInOut" }}
                className="absolute"
              >
                <span className={`text-[4.5em] animate-glow nabla-text nabla-purple ${nabla.className}`}>
                  <span className="brightness-150">G</span><span className="brightness-75">OT</span>
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 2, ease: "easeInOut" }}
            className={`text-2xl font-light tracking-wider nabla-text ${monda.className}`}
            style={{ color: "rgb(255, 188, 255)"}}
          >
            the nyc collective
          </motion.h2>

          {ticketSalesEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 2, ease: "easeInOut" }}
              className="max-w-md mx-auto space-y-3"
            >
              <Button
                type="button"
                onClick={scrollToTickets}
                className="w-full bg-[#ffa5f9] hover:bg-[#FFD5FC] text-black font-medium text-lg py-6"
              >
                Get tickets
              </Button>
              <p className="text-amber-200/70 text-sm tracking-wide">
                August 30 · multiple acts · tickets are just below
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 2, ease: "easeInOut" }}
            className="flex items-center justify-center gap-4"
          >
            <a
              href="https://www.instagram.com/nfgxcollective/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-200/70 hover:text-amber-200"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              href="https://www.tiktok.com/@nfg.music"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-200/70 hover:text-amber-200"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </a>
          </motion.div>

        </div>
        {ticketSalesEnabled && (
          <div className="absolute bottom-7 inset-x-0 flex justify-center">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: scrollY > 40 ? 0 : 1, y: 0 }}
              transition={{ duration: 0.7, delay: scrollY > 0 ? 0 : 1.4 }}
              className="flex flex-col items-center text-center gap-1.5 text-amber-200/80 hover:text-[#ffa5f9] transition-colors"
              onClick={scrollToTickets}
              aria-label="Scroll down for tickets"
            >
              <span className="text-[11px] uppercase tracking-[0.22em]">
                Scroll for tickets
              </span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            </motion.button>
          </div>
        )}
      </section>

      <TicketBuyingSection />
      <EventsSection />
      <MusicSection />
      <BlogSection />
      
      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center text-amber-200/50 text-sm space-y-2">
        <p>© {new Date().getFullYear()} NFG Records. All rights reserved.</p>
        <p>
          Contact:{" "}
          <a
            href="mailto:nfgnycofficial@gmail.com"
            className="hover:text-amber-200 underline underline-offset-2 transition-colors"
          >
            nfgnycofficial@gmail.com
          </a>
        </p>
      </footer>
    </main>
  );
}
