"use client";

import { Phone, Instagram, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./styles/phone-input.css";
import FloatingCircles from "./components/FloatingCircles";
import EventsSection from "./components/EventsSection";
import MusicSection from "./components/MusicSection";
import BlogSection from "./components/BlogSection";
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
  weight: "700"
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
  const [phone, setPhone] = useState<string | undefined>();
  const [colors, setColors] = useState(["#FF6B6B", "#4ECDC4", "#45B7D1"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    setColors(generateRandomColors());
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async () => {
    if (!phone || isSubmitting) return;
  
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Initialize EmailJS with the public key
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
  
      setSubmitStatus('success');
      setPhone(undefined);
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <FloatingCircles />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative p-4">
        <div className="max-w-4xl w-[70w] space-y-8 text-center relative">
          <div className="relative h-[200px] flex items-center justify-center">
            <AnimatePresence>
              <motion.div
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
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                transition={{ duration: 2, ease: "circInOut" }}
                className="absolute"
              >
                <span className={`text-[4.5em] animate-glow nabla-text nabla-warm ${nabla.className}`}>
                  FOR
                </span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, x: 85, y: 60, scale: 1 }}
                transition={{ duration: 2, ease: "circInOut" }}
                className="absolute"
              >
                <span className={`text-[4.5em] animate-glow nabla-text nabla-cool ${nabla.className}`}>
                  GOT
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 2, ease: "easeInOut" }}
            className={`text-2xl text-amber-300/80 font-light tracking-wider ${monda.className}`}
            style={{
              textShadow: `0 0 5px ${colors[0]}, 0 0 15px ${colors[1]}, 0 0 30px ${colors[2]}`
            }}
          >
            a collective
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 2, ease: "easeInOut" }}
            className="relative max-w-md mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ffa5f9] via-[#FFD5FC] to-[#ffa5f9] rounded-lg blur opacity-50 animate-pulse" />
            <div className="relative bg-purple-950/80 backdrop-blur-sm rounded-lg p-6">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                  <Phone className="w-6 h-6 text-gray-200 flex-shrink-0" />
                  <PhoneInput
                    international={false}
                    defaultCountry="US"
                    limitMaxLength
                    value={phone}
                    onChange={setPhone}
                    className="!bg-transparent text-gray-200 placeholder:text-amber-200/50 [&>input]:bg-transparent [&>input]:border-none [&>input]:focus:ring-0 [&>input]:focus:outline-none"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!phone || isSubmitting}
                  className={`w-full transition-all duration-300 ${
                    submitStatus === 'success' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : submitStatus === 'error'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-[#ffa5f9] hover:bg-[#FFD5FC]'
                  } text-black font-medium`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : submitStatus === 'success' ? (
                    "Thanks! We'll text you soon"
                  ) : submitStatus === 'error' ? (
                    'Failed to send - Try again'
                  ) : (
                    "Get Updates"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 2, ease: "easeInOut" }}
            className="text-amber-200/70 max-w-lg mx-auto text-lg"
          >
            Stay in the loop on our next moves
          </motion.p>

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
          transition={{ duration: 0.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-amber-200/70" />
          </motion.div>
        </motion.div>
      </section>

      <EventsSection />
      <MusicSection />
      {/* <BlogSection /> */}
      
      {/* Footer */}
      <footer className="w-full py-6 text-center text-amber-200/50 text-sm">
        <p>© {new Date().getFullYear()} N.F.G. Records LLC. All rights reserved.</p>
      </footer>
    </main>
  );
}
