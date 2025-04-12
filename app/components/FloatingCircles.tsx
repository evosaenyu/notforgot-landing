"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CirclePosition {
  width: number;
  height: number;
  left: number;
  top: number;
}

export default function FloatingCircles() {
  const [scrollY, setScrollY] = useState(0);
  const [activeCircles, setActiveCircles] = useState<number[]>([]);
  const [positions, setPositions] = useState<CirclePosition[]>(() =>
    [...Array(15)].map(() => ({
      width: Math.random() * 100 + 100,
      height: Math.random() * 100 + 100,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY * 0.2);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getRandomIndices = () => {
      const numCircles = Math.floor(Math.random() * 3) + 3;
      const indices = new Set<number>();
      
      while (indices.size < numCircles) {
        indices.add(Math.floor(Math.random() * positions.length));
      }
      
      return Array.from(indices);
    };

    setActiveCircles(getRandomIndices());

    const glowInterval = setInterval(() => {
      setActiveCircles(getRandomIndices());
    }, 1000);

    const positionInterval = setInterval(() => {
      setPositions(
        positions.map(() => ({
          width: Math.random() * 100 + 200,
          height: Math.random() * 100 + 200,
          left: Math.random() * 100,
          top: Math.random() * 100,
        }))
      );
    }, 5000);

    return () => {
      clearInterval(glowInterval);
      clearInterval(positionInterval);
    };
  }, [positions.length]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          initial={{ opacity: 0.1, backgroundColor: "rgba(147, 51, 234, 0.1)" }}
          animate={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
            width: `${pos.width}px`,
            height: `${pos.height}px`,
            scale: activeCircles.includes(i) ? [1, 1.3, 1] : 1,
            opacity: activeCircles.includes(i) ? [0.1, 0.5, 0.1] : 0.1,
            backgroundColor: activeCircles.includes(i) 
              ? ["rgba(147, 51, 234, 0.1)", "rgba(147, 51, 234, 0.4)", "rgba(147, 51, 234, 0.1)"]
              : "rgba(147, 51, 234, 0.1)",
            rotate: scrollY * (i % 2 ? 1 : -1) * (i % 3 ? 0.5 : 1),
          }}
          transition={{
            left: { duration: 4, ease: "easeInOut" },
            top: { duration: 4, ease: "easeInOut" },
            width: { duration: 4, ease: "easeInOut" },
            height: { duration: 4, ease: "easeInOut" },
            scale: { duration: 2.5, ease: "easeInOut" },
            opacity: { duration: 2.5, ease: "easeInOut" },
            backgroundColor: { duration: 2.5, ease: "easeInOut" },
            rotate: { duration: 2, ease: "linear" },
          }}
        />
      ))}
    </div>
  );
} 