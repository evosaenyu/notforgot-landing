"use client";

import { Phone, Instagram } from "lucide-react";
import { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./styles/phone-input.css";
import FloatingCircles from "./components/FloatingCircles";
import EventsSection from "./components/EventsSection";
import MusicSection from "./components/MusicSection";
import BlogSection from "./components/BlogSection";
import emailjs from '@emailjs/browser';
import { Button } from "@/components/ui/button";

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
    // Add debug logging for environment variables
    console.log('EmailJS Configuration:', {
      serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
      // Add more debug info
      env: process.env,
      isClient: typeof window !== 'undefined',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID,
    });
    
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
          <div
            className="text-8xl font-bold flex items-center justify-center gap-1"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          >
            <span
              className="text-[1.2em] animate-glow"
              style={{
                WebkitBackgroundClip: "text",
                fontFamily: "inherit",
                fontWeight: "bold",
                textShadow: `0 0 10px ${colors[0]}, 0 0 20px ${colors[1]}, 0 0 30px ${colors[2]}`,
              }}
            >
              N
            </span>
            <span className="text-[0.2em]">o</span>
            <span className="text-[0.2em]">t</span>
            <span
              className="text-[1.2em] animate-glow"
              style={{
                WebkitBackgroundClip: "text",
                fontFamily: "inherit",
                fontWeight: "bold",
                textShadow: `0 0 10px ${colors[1]}, 0 0 20px ${colors[2]}, 0 0 30px ${colors[0]}`,
              }}
            >
              F
            </span>
            <span className="text-[0.2em]">o</span>
            <span className="text-[0.2em]">r</span>
            <span
              className="text-[1.2em] animate-glow"
              style={{
                WebkitBackgroundClip: "text",
                fontFamily: "inherit",
                fontWeight: "bold",
                textShadow: `0 0 10px ${colors[2]}, 0 0 20px ${colors[0]}, 0 0 30px ${colors[1]}`,
              }}
            >
              G
            </span>
            <span className="text-[0.2em]">o</span>
            <span className="text-[0.2em]">t</span>
          </div>

          <h2
            className="text-2xl text-amber-300/80 font-light tracking-wider"
            style={{
              transform: `translateY(${scrollY * 0.05}px)`,
            }}
          >
            a collective
          </h2>

          <div className="relative max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-lg blur opacity-50 animate-pulse" />
            <div className="relative bg-purple-950/80 backdrop-blur-sm rounded-lg p-6 border border-amber-300/30">
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
                      : 'bg-amber-400 hover:bg-amber-500'
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
          </div>

          <p className="text-amber-200/70 max-w-lg mx-auto text-lg">
            Stay in the loop on our next moves
          </p>

          <a 
            href="https://www.instagram.com/nfgxcollective/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mt-4 text-amber-200/70 hover:text-amber-200 transition-colors"
          >
            <Instagram className="w-6 h-6" />
          </a>
        </div>
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
