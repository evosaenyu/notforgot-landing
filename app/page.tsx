"use client";

import { Instagram, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import FloatingCircles from "./components/FloatingCircles";
import EventsSection from "./components/EventsSection";
import MusicSection from "./components/MusicSection";
import BlogSection from "./components/BlogSection";
import TicketBuyingSection from "./components/TicketBuyingSection";
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
      <BackgroundVideo />
      <FloatingCircles />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative p-4">
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
                  NOT
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
                  FOR
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
                  GOT
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

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 2, ease: "easeInOut" }}
            className="max-w-md mx-auto"
          >
            <Button
              type="button"
              onClick={scrollToTickets}
              className="w-full bg-[#ffa5f9] hover:bg-[#FFD5FC] text-black font-medium text-lg py-6"
            >
              Get tickets
            </Button>
          </motion.div>

          <motion.a 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 2, ease: "easeInOut" }}
            href="https://www.instagram.com/nfgxcollective/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-amber-200/70 hover:text-amber-200"
          >
            <Instagram className="w-6 h-6" />
          </motion.a>

        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: scrollY > 0 ? 0 : 1 }}
          transition={{ duration: 3, delay: 5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          onClick={scrollToTickets}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-amber-200/70" />
          </motion.div>
        </motion.div>
      </section>

      <TicketBuyingSection />
      <EventsSection />
      <MusicSection />
      <BlogSection />
      
      {/* Footer */}
      <footer className="w-full py-6 text-center text-amber-200/50 text-sm">
        <p>© {new Date().getFullYear()} N.F.G. Records LLC. All rights reserved.</p>
      </footer>
    </main>
  );
}
